import React from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../auth";
import StudentRegisterForm from "../components/StudentRegisterForm";
import AttendanceReport from "../components/AttendanceReport";

function AdminPanel() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className='p-6 min-h-screen bg-gray-100'>
      {/* Logout Button */}
      <div className='flex justify-end'>
        <button
          onClick={handleLogout}
          className='bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-300'
        >
          Logout
        </button>
      </div>

      {/* Heading */}
      <h1 className='text-2xl font-bold text-gray-800 mb-6 text-center'>
        Teacher Admin Panel
      </h1>

      {/* Student Register Section */}
      <div className='bg-white shadow-md rounded-xl p-6 mb-8 border border-gray-200'>
        <h2 className='text-lg font-semibold text-gray-700 mb-4'>
          Register Student
        </h2>
        <StudentRegisterForm />
      </div>

      {/* Attendance Report Section */}
      <div className='bg-white shadow-md rounded-xl p-6 border border-gray-200'>
        <h2 className='text-lg font-semibold text-gray-700 mb-4'>
          Attendance Report
        </h2>
        <AttendanceReport />
      </div>
    </div>
  );
}

export default AdminPanel;
