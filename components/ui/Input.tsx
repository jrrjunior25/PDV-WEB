
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input: React.FC<InputProps> = ({ label, name, className, ...props }) => {
  return (
    <div>
      {label && <label htmlFor={name} className="block text-sm font-medium text-text-secondary mb-1">{label}</label>}
      <input
        id={name}
        name={name}
        className={`w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent transition ${className}`}
        {...props}
      />
    </div>
  );
};

export default Input;
