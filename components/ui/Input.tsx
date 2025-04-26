import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string | null;
}

const Input: React.FC<InputProps> = ({
  label,
  id,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error = null,
  className = '',
  ...props
}) => {
  // Updated styles for dark backgrounds
  const baseStyle = 'mt-1 block w-full px-3 py-2 border border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm';
  const errorStyle = 'border-red-500 focus:ring-red-500 focus:border-red-500';

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-white/90">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        id={id}
        name={name || id} // Default name to id if not provided
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`${baseStyle} ${error ? errorStyle : ''} ${className}`}
        aria-invalid={!!error} // Accessibility hint
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;