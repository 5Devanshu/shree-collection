import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore }    from '../context/StoreContext';
import { useCustomer } from '../context/CustomerContext';
import './Navbar.css';

const Navbar = () => {
  const { categories, cartCount } = useStore();
  const { customer, isLoggedIn, logout } = useCustomer();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar glass-gold">
      <div className="navbar-container">

        {/* Left */}
        <div className="nav-links">
          <div className="nav-dropdown">
            <span className="nav-link label-md" style={{ cursor: 'pointer' }}>Collections</span>
            <div className="dropdown-content">
              <Link to="/collections/all" className="dropdown-item label-md">All Pieces</Link>
              {categories.map(cat => (
                <Link key={cat._id} to={`/collections/${cat.slug}`} className="dropdown-item label-md">
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
          <Link to="/" className="nav-link label-md">Home</Link>
        </div>

        {/* Center */}
        <div className="nav-logo">
          <Link to="/"><img src="/logo.png" alt="Shree Collection" className="navbar-logo-img" /></Link>
        </div>

        {/* Right */}
        <div className="nav-actions">
          {/* Customer account dropdown */}
          {isLoggedIn ? (
            <div className="nav-dropdown">
              <span className="nav-link label-md" style={{ cursor: 'pointer' }}>
                {customer.name.split(' ')[0]}
              </span>
              <div className="dropdown-content" style={{ right: 0, left: 'auto' }}>
                <Link to="/account/orders"    className="dropdown-item label-md">My Orders</Link>
                <Link to="/account/profile"   className="dropdown-item label-md">Profile</Link>
                <Link to="/account/addresses" className="dropdown-item label-md">Addresses</Link>
                <button
                  className="dropdown-item label-md"
                  onClick={handleLogout}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', color: 'var(--on-error)' }}
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="nav-link label-md">Login</Link>
          )}

          <Link to="/checkout" className="nav-link label-md">
            Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;