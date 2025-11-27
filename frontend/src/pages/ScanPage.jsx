import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CheckCircle2, AlertCircle, MapPin } from "lucide-react";

const API_URL = "http://localhost:8000/api/mark-attendance";

function ScanPage() {
  const webcamRef = useRef(null);
  const [message, setMessage] = useState("Position your face to scan.");
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // New state for success styling
  const [isLoading, setIsLoading] = useState(false);

  const capture = useCallback(async () => {
    // Reset states
    setIsLoading(true);
    setIsError(false);
    setIsSuccess(false);
    setMessage("Getting your location...");

    // 1. Geolocation Check
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by your browser.");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      // Success Callback
      (position) => {
        const { latitude, longitude } = position.coords;
        setMessage("Location found. Scanning face...");

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
          setMessage("Could not capture image. Please try again.");
          setIsError(true);
          setIsLoading(false);
          return;
        }
        // 2. Send Image and Location Data
        markAttendance(imageSrc, latitude, longitude);
      },
      // Error Callback
      () => {
        setMessage("Please enable location services to mark attendance.");
        setIsError(true);
        setIsLoading(false);
      }
    );
  }, []);

  const markAttendance = async (image_data, latitude, longitude) => {
    try {
      const response = await axios.post(API_URL, {
        image_data,
        latitude,
        longitude,
      });
      const data = response.data;

      if (data.status === "success") {
        setMessage(`Marked Present: ${data.name} (Roll: ${data.roll_no})`);
        setIsSuccess(true);
      } else if (data.status === "already_marked") {
        setMessage(data.message);
        setIsSuccess(false); // Not an error, but not a new success
        setIsError(false);
      } else {
        setMessage(data.message || "Attendance failed.");
        setIsError(true);
      }
    } catch (err) {
      console.error("Error sending image:", err);
      setMessage(err.response?.data?.detail || "Error connecting to backend.");
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine text color based on state
  const getTextColor = () => {
    if (isError) return "text-red-400";
    if (isSuccess) return "text-emerald-400";
    return "text-gray-300"; // Default/info color
  };

  return (
    <div className='absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-gray-950 via-slate-900 to-gray-800 text-gray-100 p-4'>
      <motion.h1
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
        className='mt-20 text-4xl md:text-5xl font-extrabold text-white mb-8 tracking-tight text-center z-10 relative'
      >
        Student Attendance Scanner
      </motion.h1>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='relative w-full max-w-2xl p-2 sm:p-4 rounded-3xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl flex justify-center z-10 overflow-hidden'
      >
        <Webcam
          audio={false}
          ref={webcamRef}
          mirrored={true}
          screenshotFormat='image/jpeg'
          className='rounded-2xl shadow-lg border border-white/10 w-full h-auto'
        />

        {isLoading && (
          <motion.div
            className='absolute inset-0 rounded-2xl overflow-hidden'
            animate={{ y: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          >
            <div className='w-full h-1 bg-gradient-to-r from-teal-400 via-cyan-300 to-indigo-400 opacity-90 blur-sm'></div>
          </motion.div>
        )}

        {isLoading && (
          <motion.div
            className='absolute inset-0 rounded-2xl border-2 border-teal-400/70 shadow-[0_0_30px_rgba(0,245,212,0.4)]'
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
          />
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='mt-6 px-4 py-3 max-w-md w-full rounded-xl bg-white/10 backdrop-blur-md border border-white/10 shadow-lg text-sm text-gray-200 flex items-center justify-center space-x-3 text-center'
      >
        <MapPin className='w-5 h-5 text-teal-400 flex-shrink-0' />
        <span>
          This system requires location access to verify you are on campus.
        </span>
      </motion.div>

      <motion.button
        whileHover={{ scale: 1.05, backgroundPosition: "200% 0" }}
        whileTap={{ scale: 0.95 }}
        onClick={capture}
        disabled={isLoading}
        className='mt-8 w-full max-w-xs py-3 px-6 rounded-xl font-semibold text-lg text-white bg-gradient-to-r from-teal-500 via-indigo-500 to-cyan-500 bg-[length:200%_200%] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden shadow-lg'
      >
        {isLoading ? "Processing..." : "Mark My Attendance"}
      </motion.button>

      <div className='h-12 mt-6 flex items-center'>
        <AnimatePresence>
          {message && (
            <motion.div
              key={message} // Re-triggers animation when message text changes
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className={`flex items-center space-x-2 text-lg font-medium z-10 relative ${getTextColor()}`}
            >
              {isError ? (
                <AlertCircle className='w-5 h-5' />
              ) : isSuccess ? (
                <CheckCircle2 className='w-5 h-5' />
              ) : (
                <Camera className='w-5 h-5' />
              )}
              <span className='text-center'>{message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ScanPage;
