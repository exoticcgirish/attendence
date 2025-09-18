import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { isLoggedIn, logout } from "../auth";

const Navbar = () => {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className='w-full bg-gray-900 shadow-md px-6 py-4'>
      <div className='flex justify-between items-center max-w-7xl mx-auto'>
        {/* Left Side */}
        <div className='flex items-center space-x-6'>
          <Link
            to='/'
            className='text-white font-semibold hover:text-blue-400 transition-colors duration-300'
          >
            Scan Attendance
          </Link>

          {loggedIn && (
            <Link
              to='/admin'
              className='text-white font-semibold hover:text-blue-400 transition-colors duration-300'
            >
              Admin Panel
            </Link>
          )}
        </div>

        {/* Right Side */}
        <div>
          {!loggedIn ? (
            <Link
              to='/login'
              className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-300'
            >
              Teacher Login
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className='bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-300'
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
