import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isLoggedIn, logout } from "../auth";

const Navbar = () => {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const [hasMounted, setHasMounted] = useState(false);

  // Play mount animation
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav
      className={`w-full bg-gray-900/80 backdrop-blur-sm shadow-lg fixed top-0 left-0 z-50 transition-all duration-500 ease-out ${
        hasMounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full"
      }`}
    >
      <div className='flex justify-between items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3'>
        {/* Left Side: Brand and Navigation */}
        <div className='flex items-center space-x-8'>
          {/* Brand Logo and Name */}
          <Link
            to='/'
            className='flex items-center gap-2 text-xl font-bold text-white transition-colors hover:text-sky-400'
          >
            <svg
              className='w-7 h-7'
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M5 12h14M12 5l7 7-7 7' />
              <path d='M3 3h2v2H3zM8 3h2v2H8zM13 3h2v2h-2zM18 3h2v2h-2zM3 8h2v2H3zM3 13h2v2H3zM3 18h2v2H3zM8 18h2v2H8zM13 18h2v2h-2zM18 18h2v2h-2z' />
            </svg>
            <span className='hidden sm:inline'>ScanTrack</span>
          </Link>

          {/* Navigation Links */}
          <div className='hidden md:flex items-center space-x-6'>
            {loggedIn && (
              <Link
                to='/admin'
                className='relative font-medium text-gray-300 transition-colors hover:text-white 
                after:absolute after:bottom-[-4px] after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 
                after:bg-sky-400 after:transition-transform hover:after:scale-x-100 focus:outline-none focus-visible:after:scale-x-100'
              >
                Admin Panel
              </Link>
            )}
          </div>
        </div>

        {/* Right Side: Authentication Button */}
        <div>
          {!loggedIn ? (
            <Link
              to='/login'
              className='group relative inline-flex items-center justify-center px-5 py-2.5 font-medium text-white 
              bg-gray-800 rounded-lg shadow-md transition-all duration-300 ease-in-out overflow-hidden 
              hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 
              focus-visible:ring-sky-400 focus-visible:ring-offset-gray-900'
            >
              <span
                className='absolute top-0 left-0 w-0 h-full transition-all duration-300 ease-in-out 
              bg-gradient-to-r from-sky-500 to-cyan-400 group-hover:w-full'
              ></span>
              <span className='relative'>Teacher Login</span>
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className='group relative inline-flex items-center justify-center px-5 py-2.5 font-medium text-white 
              bg-gray-800 rounded-lg shadow-md transition-all duration-300 ease-in-out overflow-hidden 
              hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 
              focus-visible:ring-red-400 focus-visible:ring-offset-gray-900'
            >
              <span
                className='absolute top-0 left-0 w-0 h-full transition-all duration-300 ease-in-out 
              bg-gradient-to-r from-red-500 to-orange-500 group-hover:w-full'
              ></span>
              <span className='relative'>Logout</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
