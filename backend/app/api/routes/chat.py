from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.rag_service import rag_service

router = APIRouter()


@router.post("/contracts/{contract_id}/chat", response_model=ChatResponse)
def chat_with_contract(
    contract_id: int,
    request: ChatRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Ask a question about ONE specific contract. Access control is
    enforced inside search_service (user only sees their own contracts
    unless admin/legal_reviewer).
    """
    result = rag_service.answer_question(
        db=db,
        question=request.question,
        user_id=current_user.id,
        user_role=current_user.role,
        contract_id=contract_id,
    )
    return result


@router.post("/chat", response_model=ChatResponse)
def chat_across_contracts(
    request: ChatRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Ask a question across ALL contracts the current user can access.
    """
    result = rag_service.answer_question(
        db=db,
        question=request.question,
        user_id=current_user.id,
        user_role=current_user.role,
        contract_id=None,
    )
    return result