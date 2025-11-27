from pydantic import BaseModel, Field
from typing import Optional, List
from bson import ObjectId
from pydantic.json_schema import JsonSchemaValue

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)
    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler) -> JsonSchemaValue:
        return {'type': 'string'}

# --- Your Existing Models ---
class Token(BaseModel):
    access_token: str
    token_type: str

class ImageInput(BaseModel):
    image_data: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class Teacher(BaseModel):
    username: str

class StudentLogin(BaseModel):
    student_id: str
    password: str

class StudentRegisterResponse(BaseModel):
    status: str
    name: str
    generated_password: str

class StudentRegister(BaseModel):
    name: str
    roll_no: str
    photo_base64: str
    password: Optional[str] = None 

class PasswordReset(BaseModel):
    new_password: str

class Student(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str
    roll_no: str
    teacher_username: str

    model_config = {
        "json_encoders": {ObjectId: str},
        "from_attributes": True, 
        "populate_by_name": True 
    }

