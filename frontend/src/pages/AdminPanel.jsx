import React from "react";
import { motion } from "framer-motion";
import { UserPlus, ClipboardList } from "lucide-react";
import StudentRegisterForm from "../components/StudentRegisterForm";
import AttendanceReport from "../components/AttendanceReport";

function AdminPanel() {
  return (
    <div className='p-6 mt-10 min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 relative overflow-hidden'>
      {/* Decorative Circles */}
      <div className='absolute top-[-100px] left-[-100px] w-72 h-72 bg-sky-200 rounded-full opacity-20 blur-3xl animate-pulse'></div>
      <div className='absolute bottom-[-120px] right-[-80px] w-96 h-96 bg-emerald-200 rounded-full opacity-20 blur-3xl animate-pulse'></div>

      {/* Page Title */}
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='text-4xl md:text-5xl font-extrabold text-gray-800 mb-12 text-center tracking-wide'
      >
        Teacher Admin Panel
      </motion.h1>

      <div className='max-w-6xl mx-auto grid gap-12 md:grid-cols-2'>
        {/* Register Student Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          whileHover={{
            scale: 1.03,
            boxShadow: "0 15px 35px rgba(0,0,0,0.12)",
          }}
          className='relative bg-gradient-to-br from-sky-100 via-sky-50 to-white shadow-lg rounded-3xl p-8 border border-sky-200 transition-all'
        >
          <div className='flex items-center mb-5'>
            <UserPlus className='text-sky-500 w-8 h-8 mr-3' />
            <h2 className='text-2xl font-semibold text-gray-700 border-l-4 border-sky-500 pl-3'>
              Register Student
            </h2>
          </div>
          <StudentRegisterForm />
        </motion.div>

        {/* Attendance Report Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
          whileHover={{
            scale: 1.03,
            boxShadow: "0 15px 35px rgba(0,0,0,0.12)",
          }}
          className='relative bg-gradient-to-br from-emerald-100 via-emerald-50 to-white shadow-lg rounded-3xl p-8 border border-emerald-200 transition-all'
        >
          <div className='flex items-center mb-5'>
            <ClipboardList className='text-emerald-500 w-8 h-8 mr-3' />
            <h2 className='text-2xl font-semibold text-gray-700 border-l-4 border-emerald-500 pl-3'>
              Attendance Report
            </h2>
          </div>
          <AttendanceReport />
        </motion.div>
      </div>
    </div>
  );
}

export default AdminPanel;
