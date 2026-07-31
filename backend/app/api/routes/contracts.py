from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.models.contract import Contract
from app.models.contract_chunk import ContractChunk
from app.models.contract_entity import ContractEntity
from app.models.contract_clause_label import ContractClauseLabel
from app.schemas.contract import ContractOut
from app.schemas.entity import EntityOut
from app.schemas.clause import ClauseOut
from app.services.file_storage import file_storage
from app.services.document_parser import document_parser
from app.services.chunking_service import chunking_service
from app.services.embedding_service import embedding_service
from app.services.entity_extraction_service import entity_extraction_service
from app.services.clause_classification_service import clause_classification_service
from app.core.database import SessionLocal

router = APIRouter()


def parse_contract_task(contract_id: int) -> None:
    """
    Background task to parse contract files, extract text and metadata,
    chunk the text, generate embeddings, extract entities, classify
    clauses, and save everything to DB.
    """
    db = SessionLocal()
    try:
        contract = db.query(Contract).filter(Contract.id == contract_id).first()
        if not contract:
            return

        contract.status = "processing"
        db.add(contract)
        db.commit()

        text, metadata = document_parser.extract_text_and_metadata(
            contract.file_path, contract.filename
        )

        contract.parsed_text = text
        contract.extracted_metadata = metadata
        db.add(contract)
        db.commit()

        # --- Chunking + embedding ---
        chunks = chunking_service.chunk_text(text)
        chunk_rows = []
        if chunks:
            embeddings = embedding_service.generate_embeddings_batch(chunks)
            for idx, (chunk_text_value, embedding_vector) in enumerate(zip(chunks, embeddings)):
                chunk_row = ContractChunk(
                    contract_id=contract.id,
                    chunk_index=idx,
                    chunk_text=chunk_text_value,
                    embedding=embedding_vector,
                )
                db.add(chunk_row)
                chunk_rows.append(chunk_row)
            db.commit()
            for chunk_row in chunk_rows:
                db.refresh(chunk_row)  # populate chunk_row.id for use below

        # --- Entity extraction (runs on full contract text) ---
        entities = entity_extraction_service.extract_entities(text)
        for entity in entities:
            entity_row = ContractEntity(
                contract_id=contract.id,
                entity_type=entity["entity_type"],
                entity_text=entity["entity_text"],
            )
            db.add(entity_row)
        db.commit()

        # --- Clause classification (runs per chunk) ---
        for chunk_row in chunk_rows:
            classification = clause_classification_service.classify_clause(chunk_row.chunk_text)
            if classification:
                label_row = ContractClauseLabel(
                    chunk_id=chunk_row.id,
                    clause_type=classification["clause_type"],
                    confidence_score=classification["confidence_score"],
                )
                db.add(label_row)
        db.commit()

        contract.status = "parsed"
        db.add(contract)
        db.commit()
    except Exception as e:
        try:
            contract = db.query(Contract).filter(Contract.id == contract_id).first()
            if contract:
                contract.status = "failed"
                contract.extracted_metadata = {"error": str(e)}
                db.add(contract)
                db.commit()
        except Exception:
            pass
    finally:
        db.close()


@router.post("/upload", response_model=ContractOut, status_code=status.HTTP_201_CREATED)
async def upload_contract(
    *,
    db: Session = Depends(deps.get_db),
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Upload a new contract file. Saves to disk, creates db record, and schedules parsing task.
    """
    content = await file.read()
    file_size = len(content)

    MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB
    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds maximum allowed size (20MB)",
        )

    try:
        file_path = file_storage.save_file(content, file.filename)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=str(e),
        )

    db_contract = Contract(
        filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        status="uploaded",
        uploaded_by_id=current_user.id,
    )
    db.add(db_contract)
    db.commit()
    db.refresh(db_contract)

    background_tasks.add_task(parse_contract_task, db_contract.id)

    return db_contract


@router.get("/", response_model=List[ContractOut])
def list_contracts(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    List contracts. Viewers can only see their own. Admins/reviewers can see all.
    """
    if current_user.role in ["admin", "legal_reviewer"]:
        contracts = db.query(Contract).all()
    else:
        contracts = db.query(Contract).filter(Contract.uploaded_by_id == current_user.id).all()
    return contracts


@router.get("/{contract_id}", response_model=ContractOut)
def get_contract(
    contract_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get detailed contract metadata and parsed content.
    """
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found",
        )

    if current_user.role not in ["admin", "legal_reviewer"] and contract.uploaded_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this contract",
        )

    return contract


@router.get("/{contract_id}/download")
def download_contract(
    contract_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Download the original contract file.
    """
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found",
        )

    if current_user.role not in ["admin", "legal_reviewer"] and contract.uploaded_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to download this contract",
        )

    return FileResponse(
        contract.file_path,
        filename=contract.filename,
        media_type="application/octet-stream",
    )


@router.get("/{contract_id}/entities", response_model=list[EntityOut])
def get_contract_entities(
    contract_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    List extracted named entities (orgs, people, dates, money, locations) for a contract.
    """
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    if current_user.role not in ["admin", "legal_reviewer"] and contract.uploaded_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this contract",
        )

    return db.query(ContractEntity).filter(ContractEntity.contract_id == contract_id).all()


@router.get("/{contract_id}/clauses", response_model=list[ClauseOut])
def get_contract_clauses(
    contract_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    List classified clauses (type + confidence + source text) for a contract.
    """
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    if current_user.role not in ["admin", "legal_reviewer"] and contract.uploaded_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this contract",
        )

    results = (
        db.query(ContractClauseLabel, ContractChunk.chunk_text)
        .join(ContractChunk, ContractClauseLabel.chunk_id == ContractChunk.id)
        .filter(ContractChunk.contract_id == contract_id)
        .all()
    )
    return [
        ClauseOut(
            id=label.id,
            chunk_id=label.chunk_id,
            clause_type=label.clause_type,
            confidence_score=label.confidence_score,
            chunk_text=chunk_text,
        )
        for label, chunk_text in results
    ]


@router.delete("/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contract(
    contract_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> None:
    """
    Delete a contract record and remove its file from disk.
    Only the owner or an admin can delete.
    """
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found",
        )

    if current_user.role != "admin" and contract.uploaded_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this contract",
        )

    file_storage.delete_file(contract.file_path)
    db.delete(contract)
    db.commit()