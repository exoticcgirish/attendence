import React, { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { authHeader } from "../auth"; // Import auth header

const REGISTER_API_URL = "http://localhost:8000/api/register-student";

function StudentRegisterForm() {
  const webcamRef = useRef(null);
  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const captureAndRegister = useCallback(async () => {
    setMessage("Processing...");
    setIsError(false);
    const photo_base64 = webcamRef.current.getScreenshot();

    if (!photo_base64 || !name || !rollNo) {
      setMessage("⚠️ Error: All fields and photo are required.");
      setIsError(true);
      return;
    }

    try {
      const response = await axios.post(
        REGISTER_API_URL,
        {
          name: name,
          roll_no: rollNo,
          photo_base64: photo_base64,
        },
        {
          headers: authHeader(),
        }
      );

      setMessage(`✅ Success! Student ${response.data.name} registered.`);
      setIsError(false);
      setName("");
      setRollNo("");
    } catch (err) {
      setMessage(err.response?.data?.detail || "❌ Error registering student.");
      setIsError(true);
      console.error(err);
    }
  }, [name, rollNo, webcamRef]);

  return (
    <div className='bg-gray-50 p-6 rounded-xl shadow-lg'>
      <h2 className='text-2xl font-bold text-gray-800 mb-6 text-center'>
        Register New Student
      </h2>

      {/* Form Fields */}
      <div className='flex flex-col sm:flex-row gap-4 mb-6'>
        <input
          type='text'
          placeholder='Student Name'
          value={name}
          onChange={(e) => setName(e.target.value)}
          className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none'
        />
        <input
          type='text'
          placeholder='Roll Number'
          value={rollNo}
          onChange={(e) => setRollNo(e.target.value)}
          className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none'
        />
      </div>

      {/* Webcam */}
      <div className='flex justify-center mb-6'>
        <div className='border border-gray-300 rounded-xl shadow-md overflow-hidden bg-black'>
          <Webcam
            audio={false}
            height={360}
            width={480}
            ref={webcamRef}
            screenshotFormat='image/jpeg'
            className='rounded-md'
            videoConstraints={{
              facingMode: "user",
              width: 480,
              height: 360,
            }}
          />
        </div>
      </div>

      {/* Register Button */}
      <button
        onClick={captureAndRegister}
        className='w-full bg-green-500 hover:bg-green-600 text-white font-semibold text-lg px-4 py-3 rounded-lg shadow-md transition-all duration-300'
      >
        📸 Take Photo & Register Student
      </button>

      {/* Feedback Message */}
      {message && (
        <p
          className={`mt-4 text-center font-medium ${
            isError ? "text-red-500" : "text-green-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

export default StudentRegisterForm;
