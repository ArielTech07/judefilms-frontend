import React from 'react';
import './Card.css';

const Card = ({ children, className = '', onClick }) => {
  return (
    <div 
      className={`card ${onClick ? 'clickable' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
