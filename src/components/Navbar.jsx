import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar glass-gold">
      <div className="navbar-container">
        {/* Left Links */}
        <div className="nav-links">
          <div className="nav-dropdown">
            <span className="nav-link label-md" style={{cursor: 'pointer'}}>Collections</span>
            <div className="dropdown-content">
              <Link to="/collections/bangles" className="dropdown-item label-md">Bangles</Link>
              <Link to="/collections/necklaces" className="dropdown-item label-md">Necklaces</Link>
            </div>
          </div>
          <Link to="/" className="nav-link label-md">Home Page</Link>
        </div>

        {/* Center Logo */}
        <div className="nav-logo">
          <img src="/logo.png" alt="Shree Logo" className="navbar-logo-img" />
        </div>

        {/* Right Icons/Links */}
        <div className="nav-actions">
          <Link to="/admin" className="nav-link label-md">Admin</Link>
          <a href="#search" className="nav-link label-md">Search</a>
          <a href="#cart" className="nav-link label-md">Cart (0)</a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
