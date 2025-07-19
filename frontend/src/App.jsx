import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Portfolio";
import ImportPage from "./pages/ImportPage";
import AnalysisPage from "./pages/AnalysisPage";

function App() {
  return (
    <div className="min-h-screen bg-black text-white w-full overflow-x-hidden">
      <Router>
        <Navbar />
        <div className="w-full px-2 sm:px-4 mt-6 sm:mt-8">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
            <Route path="/import" element={<PrivateRoute><ImportPage /></PrivateRoute>} />
            <Route path="/analysis" element={<PrivateRoute><AnalysisPage /></PrivateRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
