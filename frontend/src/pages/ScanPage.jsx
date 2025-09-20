import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CheckCircle2, AlertCircle } from "lucide-react";

const API_URL = "http://localhost:8000/api/mark-attendance";

function ScanPage() {
  const webcamRef = useRef(null);
  const [message, setMessage] = useState("Please scan your face.");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const capture = useCallback(async () => {
    setMessage("Processing...");
    setIsError(false);
    setIsLoading(true);

    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      setMessage("Could not capture image.");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(API_URL, { image_data: imageSrc });
      const data = response.data;

      if (data.status === "success") {
        setMessage(`Marked Present: ${data.name} (Roll: ${data.roll_no})`);
        setIsError(false);
      } else if (data.status === "already_marked") {
        setMessage(`${data.message}`);
        setIsError(false);
      } else {
        setMessage(data.message || "Unknown student.");
        setIsError(true);
      }
    } catch (err) {
      console.error("Error sending image:", err);
      setMessage(err.response?.data?.detail || "Error connecting to backend.");
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [webcamRef]);

  return (
    <div className='absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-gray-950 via-slate-900 to-gray-800 text-gray-100'>
      {/* Title (just below navbar, no extra margin) */}
      <motion.h1
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
        className='mt-20 text-4xl md:text-5xl font-extrabold text-white mb-8 tracking-tight z-10 relative'
      >
        Student Attendance Scanner
      </motion.h1>

      {/* Webcam container */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='relative w-full max-w-3xl p-4 rounded-3xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl flex justify-center z-10 overflow-hidden'
      >
        <Webcam
          audio={false}
          height={480}
          width={640}
          ref={webcamRef}
          screenshotFormat='image/jpeg'
          className='rounded-2xl shadow-lg border border-white/10'
        />

        {/* Scanning line */}
        {isLoading && (
          <motion.div
            className='absolute inset-0 rounded-2xl overflow-hidden'
            animate={{ y: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          >
            <div className='w-full h-1 bg-gradient-to-r from-teal-400 via-cyan-300 to-indigo-400 opacity-90 blur-sm'></div>
          </motion.div>
        )}

        {/* Border glow */}
        {isLoading && (
          <motion.div
            className='absolute inset-0 rounded-2xl border-2 border-teal-400/70 shadow-[0_0_30px_rgba(0,245,212,0.4)]'
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
          />
        )}
      </motion.div>

      {/* Info card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='mt-6 px-6 py-4 max-w-md rounded-xl bg-white/10 backdrop-blur-md border border-white/10 shadow-lg text-sm text-gray-200 flex items-center space-x-3'
      >
        <Camera className='w-5 h-5 text-teal-400' />
        <span>Position your face in front of the camera for scanning.</span>
      </motion.div>

      {/* Button */}
      <motion.button
        whileHover={{
          scale: 1.05,
          backgroundPosition: "200% 0",
          boxShadow:
            "0 0 25px rgba(0,245,212,0.5), 0 0 50px rgba(99,102,241,0.4)",
        }}
        whileTap={{ scale: 0.95 }}
        onClick={capture}
        disabled={isLoading}
        className='mt-8 w-full max-w-xs py-3 px-6 rounded-xl font-semibold text-lg text-white bg-gradient-to-r from-teal-500 via-indigo-500 to-cyan-500 bg-[length:200%_200%] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden'
      >
        {isLoading ? "Processing..." : "Mark My Attendance"}
      </motion.button>

      {/* Status message with icons */}
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className={`mt-6 flex items-center space-x-2 text-lg font-medium z-10 relative ${
              isError ? "text-red-400" : "text-emerald-400"
            }`}
          >
            {isError ? (
              <AlertCircle className='w-5 h-5' />
            ) : (
              <CheckCircle2 className='w-5 h-5' />
            )}
            <span>{message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ScanPage;
