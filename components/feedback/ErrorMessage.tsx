import React from 'react';

interface ErrorMessageProps {
  message: string | null;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="mb-4 p-3 rounded-md bg-red-100 border border-red-300 text-red-700">
      <p>{message}</p>
    </div>
  );
};

export default ErrorMessage;