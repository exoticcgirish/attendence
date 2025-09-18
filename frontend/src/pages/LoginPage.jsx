import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../auth";

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
      setError("Invalid username or password.");
    }
  };

  return (
    <div className='flex items-center justify-center min-h-screen bg-gray-100 px-4'>
      <div className='w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200'>
        <h2 className='text-2xl font-bold text-gray-800 mb-6 text-center'>
          Teacher Login
        </h2>

        <form onSubmit={handleLogin} className='space-y-5'>
          {/* Username */}
          <div>
            <label className='block text-gray-700 font-medium mb-1'>
              Username
            </label>
            <input
              type='text'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none'
            />
          </div>

          {/* Password */}
          <div>
            <label className='block text-gray-700 font-medium mb-1'>
              Password
            </label>
            <input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none'
            />
          </div>

          {/* Error Message */}
          {error && <p className='text-red-500 text-sm'>{error}</p>}

          {/* Login Button */}
          <button
            type='submit'
            className='w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg shadow-md transition-all duration-300'
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
