import React from "react";
import { Routes, Route } from "react-router-dom";
// import ""
import "./index.css";

// Import your new Navbar
import Navbar from "./components/Navbar";

// Import your pages
import ScanPage from "./pages/ScanPage";
import LoginPage from "./pages/LoginPage";
import AdminPanel from "./pages/AdminPanel";

// Import your route protector
import ProtectedRoute from "./components/ ProtectedRoute.jsx";

function App() {
  return (
    <div>
      <Navbar />
      <main style={{ padding: "20px" }}>
        <Routes>
          <Route path='/' element={<ScanPage />} />
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
