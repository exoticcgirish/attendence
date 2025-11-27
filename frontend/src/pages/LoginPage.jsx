import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../auth";
import { motion } from "framer-motion";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(username, password);
      navigate("/admin"); // Redirect to admin panel on success
    } catch (err) {
      console.error(err);
      setError("❌ Invalid username or password.");
    }
  };

  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 px-4'>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className='w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-200'
      >
        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='text-3xl font-extrabold text-gray-800 mb-6 text-center'
        >
          Teacher Login
        </motion.h2>

        {/* Form */}
        <form onSubmit={handleLogin} className='space-y-5'>
          {/* Username */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className='block text-gray-700 font-medium mb-1'>
              Username
            </label>
            <input
              type='text'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm transition-all'
              placeholder='Enter your username'
            />
          </motion.div>

          {/* Password */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className='block text-gray-700 font-medium mb-1'>
              Password
            </label>
            <input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm transition-all'
              placeholder='Enter your password'
            />
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='text-red-500 text-sm font-medium'
            >
              {error}
            </motion.p>
          )}

          {/* Login Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type='submit'
            className='w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg shadow-md transition-all duration-300 font-semibold text-lg'
          >
            Login
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

export default LoginPage;
