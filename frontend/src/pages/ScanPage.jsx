import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";

const API_URL = "http://localhost:8000/api/mark-attendance";

function ScanPage() {
  const webcamRef = useRef(null);
  const [message, setMessage] = useState("Please scan your face.");
  const [isError, setIsError] = useState(false);

  const capture = useCallback(async () => {
    setMessage("Processing...");
    setIsError(false);
    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      setMessage("Could not capture image.");
      setIsError(true);
      return;
    }

    try {
      const response = await axios.post(API_URL, {
        image_data: imageSrc,
      });

      if (response.data.status === "success") {
        setMessage(
          `✅ Marked Present: ${response.data.name} (Roll: ${response.data.roll_no})`
        );
        setIsError(false);
      } else {
        setMessage(response.data.message || "Unknown student.");
        setIsError(true);
      }
    } catch (err) {
      console.error("Error sending image:", err);
      setMessage(err.response?.data?.detail || "Error connecting to backend.");
      setIsError(true);
    }
  }, [webcamRef]);

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4'>
      <h1 className='text-3xl font-bold text-gray-800 mb-6'>
        Student Attendance Scan
      </h1>

      {/* Webcam Container */}
      <div className='w-full max-w-2xl bg-white shadow-lg rounded-xl border border-gray-300 p-4 flex justify-center'>
        <Webcam
          audio={false}
          height={480}
          width={640}
          ref={webcamRef}
          screenshotFormat='image/jpeg'
          className='rounded-lg border border-gray-200'
        />
      </div>

      {/* Scan Button */}
      <button
        onClick={capture}
        className='mt-6 bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold px-6 py-3 rounded-lg shadow-md transition-all duration-300'
      >
        Mark My Attendance
      </button>

      {/* Message */}
      {message && (
        <h2
          className={`mt-6 text-lg font-medium ${
            isError ? "text-red-500" : "text-green-600"
          }`}
        >
          {message}
        </h2>
      )}
    </div>
  );
}

export default ScanPage;
