from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import numpy as np
import cv2
import base64
import os
import math
from deepface import DeepFace
from jose import JWTError, jwt
from typing import List
from contextlib import asynccontextmanager

from db import get_db_client, MAIN_AUTH_DB_NAME, SCHOOL_DB_NAME
from models import Token, StudentRegister, ImageInput, Teacher, StudentLogin, StudentRegisterResponse, PasswordReset, Student
from auth import (
    create_access_token, get_current_teacher,
    ACCESS_TOKEN_EXPIRE_MINUTES, authenticate_teacher, get_password_hash,
    SECRET_KEY, ALGORITHM, pwd_context
)
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Server starting up...")
    
    dummy_image = np.zeros((100, 100, 3), dtype=np.uint8)
    cv2.imwrite("dummy.jpg", dummy_image)
    
    print("🧠 Pre-loading face recognition model. This might take a moment...")
    _ = DeepFace.find(
        img_path="dummy.jpg", 
        db_path=FACE_DB_PATH,
        enforce_detection=False
    )
    print("✅ Model pre-loaded successfully!")
    os.remove("dummy.jpg")
    
    yield
    
    print("👋 Server shutting down.")

app = FastAPI(lifespan=lifespan)

FACE_DB_PATH = "student_face_db"
os.makedirs(FACE_DB_PATH, exist_ok=True)

origins = [
    "https://attendance-frontend-liard.vercel.app/",
    "http://localhost:5173",  
    
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

EYE_CASCADE_PATH = cv2.data.haarcascades + "haarcascade_eye.xml"
if not os.path.exists(EYE_CASCADE_PATH):
    raise RuntimeError(f"Could not find eye cascade model at {EYE_CASCADE_PATH}")
eye_cascade = cv2.CascadeClassifier(EYE_CASCADE_PATH)
if eye_cascade.empty():
    raise RuntimeError("Failed to load eye cascade model.")

ALLOWED_LAT = 28.461406733073787
ALLOWED_LON = 77.49557495915565
ALLOWED_RADIUS_METERS = 200 
IST_OFFSET = timedelta(hours=5, minutes=30)

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def detect_liveness(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    eyes = eye_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    return len(eyes) > 0

oauth2_scheme_student = OAuth2PasswordBearer(tokenUrl="/api/student/login")

async def authenticate_student(db, roll_no: str, password: str):
    student = await db.students.find_one({"roll_no": roll_no})
    if not student or not pwd_context.verify(password, student.get("hashed_password", "")):
        return None
    return student

async def get_current_student(token: str = Depends(oauth2_scheme_student), db_client: AsyncIOMotorClient = Depends(get_db_client)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        roll_no: str = payload.get("sub")
        if roll_no is None: raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    student = await db_client[SCHOOL_DB_NAME].students.find_one({"roll_no": roll_no})
    if student is None: raise credentials_exception
    return student

@app.post("/token", response_model=Token, tags=["Teacher"])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db_client: AsyncIOMotorClient = Depends(get_db_client)):
    main_auth_db = db_client[MAIN_AUTH_DB_NAME]
    teacher = await authenticate_teacher(main_auth_db, form_data.username, form_data.password)
    if not teacher: raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": teacher["username"]}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/register-teacher", tags=["Teacher"])
async def register_teacher(username: str, password: str, db_client: AsyncIOMotorClient = Depends(get_db_client)):
    main_auth_db = db_client[MAIN_AUTH_DB_NAME]
    if await main_auth_db.teachers.find_one({"username": username}): raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(password)
    await main_auth_db.teachers.insert_one({"username": username, "hashed_password": hashed_password})
    return {"status": f"teacher {username} created successfully"}

@app.post("/api/register-student", response_model=StudentRegisterResponse, tags=["Student Management"])
async def register_student(student: StudentRegister, db_client: AsyncIOMotorClient = Depends(get_db_client), current_teacher: Teacher = Depends(get_current_teacher)):
    school_db = db_client[SCHOOL_DB_NAME]
    if await school_db.students.find_one({"roll_no": student.roll_no}):
        raise HTTPException(status_code=400, detail="A student with this roll number already exists.")

    password = student.password if student.password else student.roll_no
    hashed_password = get_password_hash(password)
    
    student_document = {
        "name": student.name,
        "roll_no": student.roll_no,
        "teacher_username": current_teacher['username'],
        "hashed_password": hashed_password
    }
    await school_db.students.insert_one(student_document)
    
    image_data = base64.b64decode(student.photo_base64.split(',')[1])
    img = cv2.imdecode(np.frombuffer(image_data, np.uint8), cv2.IMREAD_COLOR)
    cv2.imwrite(os.path.join(FACE_DB_PATH, f"{student.roll_no}.jpg"), img)
    
    return {"status": "success", "name": student.name, "generated_password": password}

@app.get("/api/teacher/students", response_model=List[Student], tags=["Student Management"])
async def get_teacher_students(db_client: AsyncIOMotorClient = Depends(get_db_client), current_teacher: Teacher = Depends(get_current_teacher)):
    school_db = db_client[SCHOOL_DB_NAME]
    students_cursor = school_db.students.find({"teacher_username": current_teacher['username']})
    students = await students_cursor.to_list(length=None)
    return [Student(**s) for s in students]

@app.put("/api/teacher/students/{roll_no}/reset-password", tags=["Student Management"])
async def reset_student_password(roll_no: str, password_data: PasswordReset, db_client: AsyncIOMotorClient = Depends(get_db_client), current_teacher: Teacher = Depends(get_current_teacher)):
    school_db = db_client[SCHOOL_DB_NAME]
    student = await school_db.students.find_one({"roll_no": roll_no, "teacher_username": current_teacher['username']})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found or not under your management.")
    
    new_hashed_password = get_password_hash(password_data.new_password)
    await school_db.students.update_one({"roll_no": roll_no}, {"$set": {"hashed_password": new_hashed_password}})
    return {"status": "success", "message": f"Password for {roll_no} has been updated."}

@app.get("/api/attendance-report", tags=["Attendance"])
async def get_attendance_report(date: str, db_client: AsyncIOMotorClient = Depends(get_db_client), current_teacher: Teacher = Depends(get_current_teacher)):
    school_db = db_client[SCHOOL_DB_NAME]
    start_date = datetime.fromisoformat(date).replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = start_date + timedelta(days=1)
    query = {"timestamp": {"$gte": start_date, "$lt": end_date}, "teacher_username": current_teacher['username']}
    records = await school_db.attendance.find(query).to_list(length=None)
    for record in records:
        record["_id"] = str(record["_id"])
        record["timestamp"] = record["timestamp"].isoformat()
    return records

@app.post("/api/mark-attendance", tags=["Attendance"])
async def mark_attendance(input_data: ImageInput, db_client: AsyncIOMotorClient = Depends(get_db_client)):
    school_db = db_client[SCHOOL_DB_NAME]
    
    if input_data.latitude is None or input_data.longitude is None:
        raise HTTPException(status_code=400, detail="Location data not provided.")
    
    distance = haversine(input_data.latitude, input_data.longitude, ALLOWED_LAT, ALLOWED_LON)
    if distance > ALLOWED_RADIUS_METERS:
        raise HTTPException(status_code=403, detail=f"You are {int(distance)} meters away. Please be on campus.")
    
    image_data = base64.b64decode(input_data.image_data.split(',')[1])
    img = cv2.imdecode(np.frombuffer(image_data, np.uint8), cv2.IMREAD_COLOR)
    
    if not detect_liveness(img):
        raise HTTPException(status_code=400, detail="Liveness check failed. Please use a live photo.")

    try:
        dfs = DeepFace.find(img_path=img, db_path=FACE_DB_PATH, enforce_detection=True, silent=True)
    except ValueError:
        raise HTTPException(status_code=404, detail="No face detected clearly in the provided image.")
        
    if not isinstance(dfs, list) or not dfs or dfs[0].empty:
        raise HTTPException(status_code=404, detail="Unknown student.")
    
    identity_path = dfs[0].iloc[0]['identity']
    roll_no = os.path.splitext(os.path.basename(identity_path))[0]
    student = await school_db.students.find_one({"roll_no": roll_no})
    
    if not student:
        raise HTTPException(status_code=404, detail="Face recognized but student data not found.")
    
    now_ist = datetime.utcnow() + IST_OFFSET
    start_of_day = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)
    
    if await school_db.attendance.find_one({"roll_no": roll_no, "timestamp": {"$gte": start_of_day}}):
        raise HTTPException(status_code=409, detail=f"Attendance already marked for {student['name']} today.")
    
    attendance_record = {
        "student_id": str(student["_id"]), "name": student["name"], "roll_no": student["roll_no"],
        "teacher_username": student["teacher_username"], "timestamp": now_ist,
        "latitude": input_data.latitude, "longitude": input_data.longitude
    }
    await school_db.attendance.insert_one(attendance_record)
    return {"status": "success", "name": student["name"], "roll_no": student["roll_no"]}

# --- Student Portal Endpoints ---
@app.post("/api/student/login", response_model=Token, tags=["Student Portal"])
async def student_login(form_data: StudentLogin, db_client: AsyncIOMotorClient = Depends(get_db_client)):
    school_db = db_client[SCHOOL_DB_NAME]
    student = await authenticate_student(school_db, form_data.student_id, form_data.password)
    if not student:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect Student ID or password")
    
    access_token = create_access_token(data={"sub": student["roll_no"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/student/me/attendance", tags=["Student Portal"])
async def get_student_attendance(db_client: AsyncIOMotorClient = Depends(get_db_client), current_student: dict = Depends(get_current_student)):
    school_db = db_client[SCHOOL_DB_NAME]
    
    attendance_cursor = school_db.attendance.find({"roll_no": current_student["roll_no"]})
    student_attendance_records = await attendance_cursor.to_list(length=None)
    present_days = len(student_attendance_records)

    pipeline = [
        {"$match": {"teacher_username": current_student["teacher_username"]}},
        {"$group": {"_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}}}},
        {"$count": "total_days"}
    ]
    total_days_agg = await school_db.attendance.aggregate(pipeline).to_list(length=1)
    total_school_days = total_days_agg[0]['total_days'] if total_days_agg else 0

    percentage = (present_days / total_school_days * 100) if total_school_days > 0 else 0

    for record in student_attendance_records:
        record["_id"] = str(record["_id"])
        record["timestamp"] = record["timestamp"].isoformat()

    return {
        "name": current_student["name"],
        "roll_no": current_student["roll_no"],
        "attendance_records": student_attendance_records,
        "percentage": percentage
    }
    
    
