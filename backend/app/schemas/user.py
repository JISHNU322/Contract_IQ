from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict

# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = True
    role: Optional[str] = "viewer"  # admin | legal_reviewer | viewer

# Properties to receive via API on creation
class UserCreate(UserBase):
    email: EmailStr
    password: str

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None

# Properties to return to client
class UserOut(UserBase):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool
    role: str

    model_config = ConfigDict(from_attributes=True)

# Additional properties stored in DB
class UserInDB(UserOut):
    hashed_password: str

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id: Optional[str] = None