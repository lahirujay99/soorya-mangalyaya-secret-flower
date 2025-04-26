'use client';

import React from 'react';
import Image from 'next/image';

interface BackgroundWrapperProps {
  children: React.ReactNode;
}

const BackgroundWrapper: React.FC<BackgroundWrapperProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full relative">
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/image.png"
          alt="Background"
          fill
          priority
          style={{ objectFit: 'cover' }}
          className="blur-md" // Adding blur effect using Tailwind's blur utility
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
};

export default BackgroundWrapper;