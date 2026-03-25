import React from 'react';
import './Button.css';

const Button = ({ children, variant = 'primary', onClick, className = '' }) => {
  return (
    <button className={`btn btn-${variant} label-md ${className}`} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;
