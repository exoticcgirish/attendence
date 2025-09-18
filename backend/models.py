from pydantic import BaseModel
from typing import List, Optional

# --- Authentication Models ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class Teacher(BaseModel):
    username: str

class TeacherInDB(Teacher):
    hashed_password: str

# --- Student Models ---
class StudentRegister(BaseModel):
    name: str
    roll_no: str
    photo_base64: str  # Image from webcam

class StudentInDB(BaseModel):
    name: str
    roll_no: str
    face_encoding: List[float]

# --- Attendance Models ---
class ImageInput(BaseModel):
    image_data: str  # Image from webcam