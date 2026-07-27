from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

# Shared properties
class ContractBase(BaseModel):
    filename: str

# Properties to receive via API on creation (internal use)
class ContractCreate(ContractBase):
    file_path: str
    file_size: int
    uploaded_by_id: int

# Properties to receive via API on update
class ContractUpdate(BaseModel):
    status: Optional[str] = None
    parsed_text: Optional[str] = None
    extracted_metadata: Optional[Dict[str, Any]] = None

# Properties to return to client
class ContractOut(ContractBase):
    id: int
    file_size: int
    status: str
    uploaded_at: datetime
    uploaded_by_id: int
    parsed_text: Optional[str] = None
    extracted_metadata: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)
