from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.schemas.graph import GraphResponse
from app.services.graph_service import graph_service

router = APIRouter()


@router.get("/contracts/{contract_id}/graph", response_model=GraphResponse)
def get_contract_graph(
    contract_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return graph_service.build_contract_graph(db, contract_id)


@router.get("/graph", response_model=GraphResponse)
def get_global_graph(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return graph_service.build_global_graph(db, current_user.id, current_user.role)