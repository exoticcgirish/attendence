import datetime
import zoneinfo 
from datetime import timedelta# Modern way to handle timezones
import base64
import os
from typing import List, Any

from bson import ObjectId
from pydantic import BaseModel, Field
from pydantic.json_schema import GetJsonSchemaHandler
from pydantic_core import core_schema
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorClient
import numpy as np
import cv2
from deepface import DeepFace

# Your existing imports for your project structure
from db import get_db_client, MAIN_AUTH_DB_NAME, SCHOOL_DB_NAME
from models import Token, StudentRegister, ImageInput, Teacher
from auth import (
    create_access_token, get_current_teacher,
    ACCESS_TOKEN_EXPIRE_MINUTES, authenticate_teacher, get_password_hash
)

app = FastAPI()

FACE_DB_PATH = "student_face_db"
os.makedirs(FACE_DB_PATH, exist_ok=True)

# CORS Middleware
origins = ["http://localhost:5173", "http://localhost"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Pydantic Models & Custom Types for API ---

# Pydantic V2 compatible class to handle MongoDB's ObjectId
class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler
    ) -> core_schema.CoreSchema:
        def validate_from_str(v: str) -> ObjectId:
            if not ObjectId.is_valid(v):
                raise ValueError("Invalid ObjectId")
            return ObjectId(v)
        return core_schema.union_schema(
            [
                core_schema.is_instance_schema(ObjectId),
                core_schema.no_info_plain_validator_function(validate_from_str),
            ],
            serialization=core_schema.to_string_ser_schema(),
        )
    @classmethod
    def __get_pydantic_json_schema__(
        cls, core_schema: core_schema.CoreSchema, handler: GetJsonSchemaHandler
    ) -> dict[str, Any]:
        return {"type": "string", "format": "ObjectId"}

# Pydantic model for the attendance report response
class AttendanceRecord(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    roll_no: str
    name: str
    timestamp: datetime.datetime
    teacher_username: str

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# --- API Endpoints ---

@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db_client: AsyncIOMotorClient = Depends(get_db_client)
):
    main_auth_db = db_client[MAIN_AUTH_DB_NAME]
    teacher = await authenticate_teacher(main_auth_db, form_data.username, form_data.password)
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": teacher["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/register-teacher")
async def register_teacher(
    username: str, 
    password: str, 
    db_client: AsyncIOMotorClient = Depends(get_db_client)
):
    main_auth_db = db_client[MAIN_AUTH_DB_NAME]
    if await main_auth_db.teachers.find_one({"username": username}):
        raise HTTPException(status_code=400, detail="Username already registered")
        
    hashed_password = get_password_hash(password)
    teacher_doc = {"username": username, "hashed_password": hashed_password}
    await main_auth_db.teachers.insert_one(teacher_doc)
    return {"status": f"Teacher '{username}' created successfully"}

@app.post("/api/register-student")
async def register_student(
    student: StudentRegister,
    db_client: AsyncIOMotorClient = Depends(get_db_client),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    school_db = db_client[SCHOOL_DB_NAME]
    try:
        student_document = {
            "name": student.name,
            "roll_no": student.roll_no,
            "teacher_username": current_teacher['username']
        }
        await school_db.students.insert_one(student_document)

        image_data = base64.b64decode(student.photo_base64.split(',')[1])
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        img_filename = f"{student.roll_no}.jpg"
        img_path = os.path.join(FACE_DB_PATH, img_filename)
        cv2.imwrite(img_path, img)

        return {"status": "success", "name": student.name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/attendance-report", response_model=List[AttendanceRecord])
async def get_attendance_report(
    date: str,
    db_client: AsyncIOMotorClient = Depends(get_db_client),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    school_db = db_client[SCHOOL_DB_NAME]
    try:
        report_date = datetime.date.fromisoformat(date)
        ist_tz = zoneinfo.ZoneInfo("Asia/Kolkata")
        
        # Create timezone-aware datetime objects for the query
        start_of_day = datetime.datetime.combine(report_date, datetime.time.min, tzinfo=ist_tz)
        end_of_day = start_of_day + timedelta(days=1)

        query = {
            "timestamp": {"$gte": start_of_day, "$lt": end_of_day},
            "teacher_username": current_teacher['username']
        }
        records = await school_db.attendance.find(query).to_list(length=None)
        return records
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/mark-attendance")
async def mark_attendance(
    input: ImageInput,
    db_client: AsyncIOMotorClient = Depends(get_db_client)
):
    school_db = db_client[SCHOOL_DB_NAME]
    temp_img_path = "temp_scan.jpg"
    
    try:
        image_data = base64.b64decode(input.image_data.split(',')[1])
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        cv2.imwrite(temp_img_path, img)

        dfs_list = DeepFace.find(
            img_path=temp_img_path,
            db_path=FACE_DB_PATH,
            enforce_detection=True
        )
        
        if not dfs_list or dfs_list[0].empty:
            return {"status": "error", "message": "Face recognized but no match in database."}
        
        identity_path = dfs_list[0].iloc[0]['identity']
        roll_no = os.path.basename(identity_path).split('.')[0]

        student = await school_db.students.find_one({"roll_no": roll_no})
        if not student:
            return {"status": "error", "message": "Face matched but student data not found."}
        
        teacher_username = student.get("teacher_username")
        if not teacher_username:
             return {"status": "error", "message": "Student found but not assigned to a teacher."}

        # ✅ Use timezone-aware datetime for accuracy
        ist_tz = zoneinfo.ZoneInfo("Asia/Kolkata")
        now_ist = datetime.datetime.now(ist_tz)
        start_of_day_ist = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)
        
        if await school_db.attendance.find_one({"roll_no": roll_no, "timestamp": {"$gte": start_of_day_ist}}):
            return {"status": "already_marked", "message": f"Attendance already marked for {student['name']} today."}

        attendance_record = {
            "student_id": str(student["_id"]),
            "name": student["name"],
            "roll_no": student["roll_no"],
            "teacher_username": teacher_username,
            "timestamp": now_ist  # Store the timezone-aware datetime object
        }
        await school_db.attendance.insert_one(attendance_record)
        
        return {"status": "success", "name": student["name"], "roll_no": student["roll_no"]}

    except ValueError as ve: # Catches DeepFace's "Face could not be detected" error
        return {"status": "error", "message": "Face not clear. Please look directly at the camera."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # ✅ Ensures the temporary file is always deleted
        if os.path.exists(temp_img_path):
            os.remove(temp_img_path)