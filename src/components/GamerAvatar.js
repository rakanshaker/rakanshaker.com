import React, { useState, useEffect, useRef } from 'react';
import GamerCanvas from './GamerCanvas';
import './GamerAvatar.css';

const GamerAvatar = ({ className }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const avatarRef = useRef(null);

  // Eye tracking logic
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (avatarRef.current) {
        const rect = avatarRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height * 0.4;
        const dx = (e.clientX - centerX) / (window.innerWidth / 2);
        const dy = (e.clientY - centerY) / (window.innerHeight / 2);

        setMousePos({
          x: Math.max(-1, Math.min(1, dx)),
          y: Math.max(-1, Math.min(1, dy))
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Blinking logic
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsBlinking(prev => !prev);
    }, isBlinking ? 250 : 4000);
    return () => clearTimeout(timeout);
  }, [isBlinking]);

  return (
    <div
      className={`avatar-wrapper ${className || ''}`}
      ref={avatarRef}
    >
      <GamerCanvas mousePos={mousePos} isBlinking={isBlinking} />
    </div>
  );
};

export default GamerAvatar;
