import React from "react";
import { motion } from "framer-motion";
import StudentRegisterForm from "../components/StudentRegisterForm";
import AttendanceReport from "../components/AttendanceReport";

function AdminPanel() {
  return (
    <div className='p-6 min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 mt-10'>
      {/* Page Title */}
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className='text-3xl font-extrabold text-gray-800 mb-10 text-center tracking-wide'
      >
        Teacher Admin Panel
      </motion.h1>

      <div className='max-w-6xl mx-auto grid gap-10 md:grid-cols-2'>
        {/* Register Student Section */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          whileHover={{
            scale: 1.02,
            boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
          }}
          className='bg-white shadow-md rounded-2xl p-6 border border-gray-200 transition-all'
        >
          <h2 className='text-xl font-semibold text-gray-700 mb-5 border-l-4 border-sky-500 pl-3'>
            Register Student
          </h2>
          <StudentRegisterForm />
        </motion.div>

        {/* Attendance Report Section */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          whileHover={{
            scale: 1.02,
            boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
          }}
          className='bg-white shadow-md rounded-2xl p-6 border border-gray-200 transition-all'
        >
          <h2 className='text-xl font-semibold text-gray-700 mb-5 border-l-4 border-emerald-500 pl-3'>
            Attendance Report
          </h2>
          <AttendanceReport />
        </motion.div>
      </div>
    </div>
  );
}

export default AdminPanel;
