import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    setMenuOpen(false);
  };

  return (
    <nav className="bg-gray-800 p-4 text-white flex items-center w-full relative">
      {/* Brand and Hamburger */}
      <div className="flex items-center justify-between w-full">
        <Link to="/" className="font-bold text-lg">Portfolio Analyzer</Link>
        {/* Hamburger for mobile */}
        <button
          className="sm:hidden ml-2 p-2 rounded focus:outline-none focus:ring-2 focus:ring-white"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        {/* Desktop Nav */}
        <div className="hidden sm:flex gap-4 items-center">
        {isLoggedIn && <Link to="/dashboard">Dashboard</Link>}
        {isLoggedIn && <Link to="/orders">Orders</Link>}
        {isLoggedIn && <Link to="/import">Import</Link>}
        {isLoggedIn && <Link to="/analysis">Analysis</Link>}
        {isLoggedIn ? (
            <button onClick={handleLogout} className="bg-red-500 px-3 py-1 rounded ml-2">Logout</button>
        ) : (
          <>
            <Link to="/login" className="mr-2">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
      </div>
      {/* Mobile Nav Dropdown */}
      {menuOpen && (
        <div className="sm:hidden absolute top-full left-0 w-full bg-gray-800 z-50 flex flex-col gap-2 p-4 border-t border-gray-700 animate-fade-in">
          {isLoggedIn && <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>}
          {isLoggedIn && <Link to="/orders" onClick={() => setMenuOpen(false)}>Orders</Link>}
          {isLoggedIn && <Link to="/import" onClick={() => setMenuOpen(false)}>Import</Link>}
          {isLoggedIn && <Link to="/analysis" onClick={() => setMenuOpen(false)}>Analysis</Link>}
          {isLoggedIn ? (
            <button onClick={handleLogout} className="bg-red-500 px-3 py-1 rounded mt-2">Logout</button>
          ) : (
            <>
              <Link to="/login" className="mt-2" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="mt-1" onClick={() => setMenuOpen(false)}>Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar; 