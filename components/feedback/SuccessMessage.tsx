import React from 'react';

interface SuccessMessageProps {
  message: string | null;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="mb-4 p-3 rounded-md bg-green-100 border border-green-300 text-green-700">
      <p>{message}</p>
    </div>
  );
};

export default SuccessMessage;