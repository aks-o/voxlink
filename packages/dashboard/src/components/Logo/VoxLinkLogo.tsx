import React from 'react';

interface VoxLinkLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const VoxLinkLogo: React.FC<VoxLinkLogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <svg
      className={`${sizeClasses[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* VoxLink Logo - Modern V with communication waves */}
      <defs>
        <linearGradient id="voxlink-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
      </defs>
      
      {/* Main V shape */}
      <path
        d="M3 4L9 20h2L17 4h-2.5L12 16L9.5 4H3z"
        fill="url(#voxlink-gradient)"
      />
      
      {/* Communication waves */}
      <path
        d="M19 8c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2z"
        fill="url(#voxlink-gradient)"
        opacity="0.7"
      />
      <path
        d="M21 6c0-2.2-1.8-4-4-4s-4 1.8-4 4"
        stroke="url(#voxlink-gradient)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M22 4c0-3.3-2.7-6-6-6s-6 2.7-6 6"
        stroke="url(#voxlink-gradient)"
        strokeWidth="1"
        fill="none"
        opacity="0.3"
      />
    </svg>
  );
};

export default VoxLinkLogo;