import React from "react";
import { Routes, Route } from "react-router-dom";
import "./index.css";
import Navbar from "./components/Navbar";
import ScanPage from "./pages/ScanPage";
import LoginPage from "./pages/LoginPage";
import AdminPanel from "./pages/AdminPanel";
import ProtectedRoute from "./components/ ProtectedRoute.jsx";
import StudentPortal from "./pages/StudentPortal.jsx";

function App() {
  return (
    <div>
      <Navbar />
      <main style={{ padding: "20px" }}>
        <Routes>
          <Route path='/' element={<ScanPage />} />
          <Route path='/student' element={<StudentPortal />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/admin' element={<ProtectedRoute />}>
            <Route path='' element={<AdminPanel />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;
