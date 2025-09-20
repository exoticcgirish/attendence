import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { authHeader } from "../auth";

const REPORT_API_URL = "http://localhost:8000/api/attendance-report";

function AttendanceReport() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState("");

  const fetchAttendance = async () => {
    setMessage("⏳ Fetching...");
    setRecords([]);
    try {
      const response = await axios.get(`${REPORT_API_URL}?date=${date}`, {
        headers: authHeader(),
      });

      if (response.data.length === 0) {
        setMessage("⚠️ No records found for this date.");
      } else {
        setRecords(response.data);
        setMessage("");
      }
    } catch (err) {
      setMessage(err.response?.data?.detail || "❌ Could not fetch report.");
      console.error(err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className='bg-gradient-to-br from-gray-50 via-white to-gray-100 p-8 rounded-2xl shadow-lg border border-gray-200'
    >
      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className='text-2xl font-bold text-gray-800 mb-6 text-center'
      >
        📊 Attendance Report
      </motion.h2>

      {/* Date Picker + Button */}
      <motion.div
        className='flex flex-col sm:flex-row items-center gap-4 mb-6 justify-center'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <input
          type='date'
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className='px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all'
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchAttendance}
          className='bg-blue-500 hover:bg-blue-600 text-white font-medium px-5 py-2 rounded-lg shadow-md transition-all'
        >
          Get Report
        </motion.button>
      </motion.div>

      {/* Message */}
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`mb-4 text-center font-medium ${
            message.includes("Fetching")
              ? "text-gray-600"
              : message.includes("No records")
              ? "text-yellow-600"
              : message.includes("Success")
              ? "text-green-600"
              : "text-red-500"
          }`}
        >
          {message}
        </motion.p>
      )}

      {/* Table */}
      {records.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className='overflow-x-auto'
        >
          <table className='w-full text-left border border-gray-200 rounded-lg overflow-hidden shadow-sm'>
            <thead>
              <tr className='bg-blue-500 text-white'>
                <th className='px-4 py-2'>Roll No.</th>
                <th className='px-4 py-2'>Name</th>
                <th className='px-4 py-2'>Time</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <motion.tr
                  key={record._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className='hover:bg-blue-50 transition-colors'
                >
                  <td className='border-t px-4 py-2'>{record.roll_no}</td>
                  <td className='border-t px-4 py-2'>{record.name}</td>
                  <td className='border-t px-4 py-2'>
                    {new Date(record.timestamp).toLocaleTimeString("en-IN", {
                      timeZone: "Asia/Kolkata",
                    })}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </motion.div>
  );
}

export default AttendanceReport;
