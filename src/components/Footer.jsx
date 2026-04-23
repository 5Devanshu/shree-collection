import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Company Info */}
        <div className="footer-section">
          <h3>Shree Collection</h3>
          <p>
            Luxury jewelry and accessories crafted with elegance and precision. Discover our exquisite collection of fine jewelry.
          </p>
          <div className="social-links">
            <a href="https://www.youtube.com/@shreecollection_byaarya?si=JzQABtjVoHYNV1Yl" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <i className="fab fa-youtube"></i>
            </a>
            <a href="https://www.instagram.com/shreecollection_byaarya?igsh=eDYyZjg3bW5jbHR4" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="https://www.facebook.com/share/18VUQvxGWN/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <i className="fab fa-facebook"></i>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/collections/all">All Collections</Link></li>
            <li><Link to="/account">My Account</Link></li>
            <li><Link to="/checkout">Cart</Link></li>
          </ul>
        </div>

        {/* Policies & Support */}
        <div className="footer-section">
          <h4>Policies</h4>
          <ul>
            <li><Link to="/terms">Terms & Conditions</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="footer-section">
          <h4>Contact Us</h4>
          <ul>
            <li>
              <strong>Email:</strong> <a href="mailto:shreecollection3006@gmail.com">shreecollection3006@gmail.com</a>
            </li>
            <li>
              <strong>Phone:</strong> <a href="tel:+919876543210">+91 93264 27627</a>
            </li>
            <li>
              <strong>Address:</strong> Shree Collection, India
            </li>
            <li>
              <strong>Hours:</strong> Mon-Sun, 10 AM - 6 PM IST
            </li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <p>Thank You</p>
        <p>&copy; {currentYear} Shree Collection. All rights reserved.</p>
        <p>Designed with <span className="heart">♥</span> for jewelry lovers</p>
      </div>
    </footer>
  );
};

export default Footer;
