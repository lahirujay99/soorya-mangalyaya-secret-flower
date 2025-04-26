import React from 'react';
import LoadingSpinner from './LoadingSpinner'; // Import the spinner

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary'; // Example variants
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  isLoading = false,
  variant = 'primary',
  className = '', // Allow passing custom classes
  ...props // Pass rest of the props like 'aria-label' etc.
}) => {
  const baseStyle = 'px-4 py-2 rounded font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition ease-in-out duration-150';
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400',
  };
  const disabledStyle = 'opacity-50 cursor-not-allowed';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variantStyles[variant]} ${ (disabled || isLoading) ? disabledStyle : ''} ${className}`}
      {...props}
    >
      {isLoading ? <LoadingSpinner /> : children}
    </button>
  );
};

export default Button;