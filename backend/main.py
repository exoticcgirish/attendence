from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import numpy as np
import cv2
import base64
import os
from deepface import DeepFace # Import DeepFace

from db import get_db, db
from models import (
    Token, StudentRegister, ImageInput, TeacherInDB, Teacher
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


@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncIOMotorClient = Depends(get_db)):
    teacher = await authenticate_teacher(db, form_data.username, form_data.password)
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
async def register_teacher(username: str, password: str, db: AsyncIOMotorClient = Depends(get_db)):
    hashed_password = get_password_hash(password)
    teacher_doc = {"username": username, "hashed_password": hashed_password}
    await db.teachers.insert_one(teacher_doc)
    return {"status": f"teacher {username} created"}

# --- Admin Panel Endpoints (Protected) ---

@app.post("/api/register-student")
async def register_student(
    student: StudentRegister,
    db: AsyncIOMotorClient = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    try:
        student_document = {
            "name": student.name,
            "roll_no": student.roll_no
        }
        await db.students.insert_one(student_document)
        
        # 2. Decode the image
        image_data = base64.b64decode(student.photo_base64.split(',')[1])
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # 3. Save the student's face image to our new face database folder
        # We name the file by the roll_no, e.g., "101.jpg"
        img_filename = f"{student.roll_no}.jpg"
        img_path = os.path.join(FACE_DB_PATH, img_filename)
        cv2.imwrite(img_path, img)
        
        return {"status": "success", "name": student.name}
    except Exception as e:
        # If DB write fails, try to remove the image
        try:
            os.remove(img_path)
        except:
            pass
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/attendance-report")
async def get_attendance_report(
    date: str, 
    db: AsyncIOMotorClient = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    try:
        start_date = datetime.fromisoformat(date)
        end_date = start_date + timedelta(days=1)
        query = {"timestamp": {"$gte": start_date, "$lt": end_date}}
        records = await db.attendance.find(query).to_list(length=None)
        
        for record in records:
            record["_id"] = str(record["_id"])
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Student Scanning Endpoint (Public) ---

@app.post("/api/mark-attendance")
async def mark_attendance(input: ImageInput, db: AsyncIOMotorClient = Depends(get_db)):
    try:
        # 1. Decode the image from the webcam
        image_data = base64.b64decode(input.image_data.split(',')[1])
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # 2. Save the scanned image temporarily
        temp_img_path = "temp_scan.jpg"
        cv2.imwrite(temp_img_path, img)

        # 3. Use DeepFace to find this face in our database folder
        # It will check "temp_scan.jpg" against all images in "student_face_db"
        dfs = DeepFace.find(
            img_path=temp_img_path,
            db_path=FACE_DB_PATH,
            enforce_detection=False # Don't crash if face isn't 100% clear
        )
        
        # 4. Check if we found a match
        if not dfs[0].empty:
            # Get the file path of the match, e.g., "student_face_db/101.jpg"
            identity_path = dfs[0].iloc[0]['identity']
            
            # Get the roll_no from the filename
            roll_no = os.path.basename(identity_path).split('.')[0] # "101"
            
            student = await db.students.find_one({"roll_no": roll_no})
            if not student:
                return {"status": "error", "message": "Face recognized but student not in DB."}
            
            attendance_record = {
                "student_id": str(student["_id"]),
                "name": student["name"],
                "roll_no": student["roll_no"],
                "timestamp": datetime.utcnow()
            }
            await db.attendance.insert_one(attendance_record)
            
            os.remove(temp_img_path) # Clean up temp file
            
            return {
                "status": "success",
                "name": student["name"],
                "roll_no": student["roll_no"]
            }
        
        os.remove(temp_img_path) # Clean up temp file
        return {"status": "error", "message": "Unknown student"}
        
    except Exception as e:
        try:
            os.remove(temp_img_path) # Clean up temp file
        except:
            pass
        raise HTTPException(status_code=500, detail=str(e))
    

