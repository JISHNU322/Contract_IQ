from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.models.contract import Contract
from app.models.contract_risk import ContractRisk
from app.schemas.risk import RiskOut
from app.services.risk_detection_service import risk_detection_service

router = APIRouter()


@router.post("/contracts/{contract_id}/analyze-risks", response_model=list[RiskOut])
def analyze_risks(
    contract_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    if current_user.role not in ["admin", "legal_reviewer"] and contract.uploaded_by_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to analyze this contract")

    # Clear previous risk analysis for this contract before re-running
    db.query(ContractRisk).filter(ContractRisk.contract_id == contract_id).delete()
    db.commit()

    risks = risk_detection_service.detect_risks(db, contract_id)
    return risks


@router.get("/contracts/{contract_id}/risks", response_model=list[RiskOut])
def get_risks(
    contract_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    if current_user.role not in ["admin", "legal_reviewer"] and contract.uploaded_by_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to view this contract")

    return db.query(ContractRisk).filter(ContractRisk.contract_id == contract_id).all()