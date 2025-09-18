import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { isLoggedIn } from "../auth";

const ProtectedRoute = () => {
  if (!isLoggedIn()) {
    // If not logged in, redirect to the login page
    return <Navigate to='/login' replace />;
  }

  // If logged in, show the child route (AdminPanel)
  return <Outlet />;
};

export default ProtectedRoute;
