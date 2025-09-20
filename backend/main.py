# main.py

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import numpy as np
import cv2
import base64
import os
from deepface import DeepFace

# This is the correct import statement
from db import get_db_client, MAIN_AUTH_DB_NAME, SCHOOL_DB_NAME
from models import (
    Token, StudentRegister, ImageInput, Teacher
)
from auth import (
    create_access_token, get_current_teacher,
    ACCESS_TOKEN_EXPIRE_MINUTES, authenticate_teacher, get_password_hash
)

app = FastAPI()

FACE_DB_PATH = "student_face_db"
os.makedirs(FACE_DB_PATH, exist_ok=True)

origins = ["http://localhost:5173", "http://localhost"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

IST_OFFSET = timedelta(hours=5, minutes=30)

# The rest of the file remains the same...

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
    return {"status": f"teacher {username} created successfully"}

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

@app.get("/api/attendance-report")
async def get_attendance_report(
    date: str,
    db_client: AsyncIOMotorClient = Depends(get_db_client),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    school_db = db_client[SCHOOL_DB_NAME]
    
    try:
        start_date_ist = datetime.fromisoformat(date)
        end_date_ist = start_date_ist + timedelta(days=1)

        query = {
            "timestamp": {"$gte": start_date_ist, "$lt": end_date_ist},
            "teacher_username": current_teacher['username']
        }
        records = await school_db.attendance.find(query).to_list(length=None)

        for record in records:
            record["_id"] = str(record["_id"])
            if "timestamp" in record and isinstance(record["timestamp"], datetime):
                record["timestamp"] = record["timestamp"].isoformat()

        return records
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

        dfs = DeepFace.find(
            img_path=temp_img_path,
            db_path=FACE_DB_PATH,
            enforce_detection=True 
        )
        
        if not dfs or dfs[0].empty:
            os.remove(temp_img_path)
            return {"status": "error", "message": "Unknown student"}
        
        identity_path = dfs[0].iloc[0]['identity']
        roll_no = os.path.basename(identity_path).split('.')[0]

        student = await school_db.students.find_one({"roll_no": roll_no})
        if not student:
            os.remove(temp_img_path)
            return {"status": "error", "message": "Face recognized but student data not found."}
        
        teacher_username = student.get("teacher_username")
        if not teacher_username:
             os.remove(temp_img_path)
             return {"status": "error", "message": "Student found but not assigned to a teacher."}

        now_ist = datetime.utcnow() + IST_OFFSET
        start_of_day = datetime(now_ist.year, now_ist.month, now_ist.day)
        
        existing_attendance = await school_db.attendance.find_one({
            "roll_no": roll_no,
            "timestamp": {"$gte": start_of_day}
        })
        if existing_attendance:
            os.remove(temp_img_path)
            return {"status": "already_marked", "message": f"Attendance already marked for today: {student['name']}"}

        attendance_record = {
            "student_id": str(student["_id"]),
            "name": student["name"],
            "roll_no": student["roll_no"],
            "teacher_username": teacher_username,
            "timestamp": now_ist
        }
        await school_db.attendance.insert_one(attendance_record)
        os.remove(temp_img_path)
        
        return {"status": "success", "name": student["name"], "roll_no": student["roll_no"]}

    except Exception as e:
        if os.path.exists(temp_img_path):
            os.remove(temp_img_path)
        
        if "Face could not be detected" in str(e):
             return {"status": "error", "message": "Face not clear. Please look directly at the camera."}
             
        raise HTTPException(status_code=500, detail=str(e))
    