import React, { useState } from "react";
import axios from "axios";
import { authHeader } from "../auth"; // Import auth header

const REPORT_API_URL = "http://localhost:8000/api/attendance-report";

function AttendanceReport() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState("");

  const fetchAttendance = async () => {
    setMessage("Fetching...");
    setRecords([]);
    try {
      const response = await axios.get(`${REPORT_API_URL}?date=${date}`, {
        headers: authHeader(), // Add the login token
      });

      if (response.data.length === 0) {
        setMessage("No records found for this date.");
      } else {
        setRecords(response.data);
        setMessage("");
      }
    } catch (err) {
      setMessage(err.response?.data?.detail || "Could not fetch report.");
      console.error(err);
    }
  };

  return (
    <div className='bg-gray-50 p-6 rounded-xl shadow-md'>
      <h2 className='text-xl font-bold text-gray-800 mb-4'>
        View Attendance Report
      </h2>

      {/* Date Picker + Button */}
      <div className='flex items-center gap-4 mb-4'>
        <input
          type='date'
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className='px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none'
        />
        <button
          onClick={fetchAttendance}
          className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-300'
        >
          Get Report
        </button>
      </div>

      {/* Message */}
      {message && (
        <p
          className={`mb-4 font-medium ${
            message.includes("Fetching")
              ? "text-gray-600"
              : message.includes("No records")
              ? "text-yellow-600"
              : "text-red-500"
          }`}
        >
          {message}
        </p>
      )}

      {/* Table */}
      {records.length > 0 && (
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse border border-gray-300'>
            <thead>
              <tr className='bg-gray-200 text-gray-700'>
                <th className='border border-gray-300 px-4 py-2'>Roll No.</th>
                <th className='border border-gray-300 px-4 py-2'>Name</th>
                <th className='border border-gray-300 px-4 py-2'>Time</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr
                  key={record._id}
                  className='hover:bg-gray-100 transition-colors'
                >
                  <td className='border border-gray-300 px-4 py-2'>
                    {record.roll_no}
                  </td>
                  <td className='border border-gray-300 px-4 py-2'>
                    {record.name}
                  </td>
                  <td className='border border-gray-300 px-4 py-2'>
                    {new Date(record.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AttendanceReport;
