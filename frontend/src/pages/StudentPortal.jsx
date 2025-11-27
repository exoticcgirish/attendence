import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const getStudentToken = () => localStorage.getItem("student_token");
const setStudentToken = (token) => localStorage.setItem("student_token", token);
const removeStudentToken = () => localStorage.removeItem("student_token");

const API_URL = "http://localhost:8000/api";

function StudentDashboard({ studentData, onLogout }) {
  const { name, roll_no, attendance_records, percentage } = studentData;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className='bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-4xl mx-auto border'
    >
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6'>
        <div>
          <h2 className='text-3xl font-bold text-gray-800'>Welcome, {name}!</h2>
          <p className='text-gray-500 mt-1'>Roll Number: {roll_no}</p>
        </div>
        <button
          onClick={onLogout}
          className='mt-4 sm:mt-0 bg-red-500 text-white font-semibold py-2 px-5 rounded-lg hover:bg-red-600 transition-colors shadow-sm'
        >
          Logout
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='bg-sky-50 p-6 rounded-xl mb-6 text-center border border-sky-200'
      >
        <p className='text-lg font-semibold text-sky-800'>
          Your Overall Attendance
        </p>
        <p className='text-5xl font-bold text-sky-600 my-2'>
          {percentage.toFixed(1)}%
        </p>
        <p className='text-md text-sky-700'>
          {attendance_records.length} out of{" "}
          {Math.round(attendance_records.length / (percentage / 100))} Total
          School Days
        </p>
      </motion.div>

      <h3 className='text-xl font-bold text-gray-700 mb-4'>
        Detailed Attendance Record
      </h3>
      <div className='overflow-y-auto max-h-80 border rounded-lg'>
        <table className='w-full text-left'>
          <thead className='sticky top-0 bg-gray-50'>
            <tr className='border-b'>
              <th className='p-4'>Date</th>
              <th className='p-4'>Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance_records.map((record) => (
              <tr key={record._id} className='border-b hover:bg-gray-50'>
                <td className='p-4 text-gray-700'>
                  {new Date(record.timestamp).toLocaleDateString()}
                </td>
                <td className='p-4'>
                  <span className='px-3 py-1 text-sm rounded-full font-semibold bg-green-100 text-green-800'>
                    Present
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ====================================================================================
// --- STUDENT LOGIN COMPONENT ---
// ====================================================================================
function StudentLoginPage({ onLoginSuccess }) {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/student/login`, {
        student_id: studentId,
        password: password,
      });
      onLoginSuccess(response.data.access_token);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className='w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border'
    >
      <div className='text-center mb-8'>
        <h1 className='text-3xl font-bold text-gray-800'>Student Portal</h1>
        <p className='text-gray-500'>Log in to view your attendance.</p>
      </div>
      <form onSubmit={handleLogin} className='space-y-4'>
        <div>
          <label className='text-sm font-medium'>Student ID (Roll No.)</label>
          <input
            type='text'
            placeholder='Enter Your username'
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className='mt-1 w-full px-4 py-3 bg-gray-50 border rounded-lg'
          />
        </div>
        <div>
          <label className='text-sm font-medium'>Password</label>
          <input
            type='password'
            placeholder='Enter Your password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='mt-1 w-full px-4 py-3 bg-gray-50 border rounded-lg'
          />
        </div>
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='text-red-500 text-sm text-center'
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        <button
          type='submit'
          disabled={isLoading}
          className='w-full mt-2 bg-sky-600 text-white font-semibold py-3 rounded-lg hover:bg-sky-700 disabled:bg-gray-400'
        >
          {isLoading ? "Logging In..." : "Login"}
        </button>
      </form>
    </motion.div>
  );
}

// ====================================================================================
// --- MAIN PORTAL CONTROLLER ---
// ====================================================================================
export default function StudentPortal() {
  const [studentData, setStudentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudentData = useCallback(async () => {
    const token = getStudentToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/student/me/attendance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudentData(response.data);
    } catch (err) {
      // Token might be expired or invalid
      removeStudentToken();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  const handleLoginSuccess = (token) => {
    setStudentToken(token);
    setIsLoading(true);
    fetchStudentData();
  };

  const handleLogout = () => {
    removeStudentToken();
    setStudentData(null);
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        Loading...
      </div>
    );
  }

  return (
    <div className='bg-gray-100 min-h-screen font-sans pt-24 p-4 flex items-start justify-center'>
      <AnimatePresence mode='wait'>
        {studentData ? (
          <StudentDashboard
            key='dashboard'
            studentData={studentData}
            onLogout={handleLogout}
          />
        ) : (
          <StudentLoginPage key='login' onLoginSuccess={handleLoginSuccess} />
        )}
      </AnimatePresence>
    </div>
  );
}
