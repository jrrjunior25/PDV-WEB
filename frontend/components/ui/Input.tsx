import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

// FIX: Changed component to use forwardRef to allow passing a ref to the underlying input element.
// This is necessary because the POS component needs to focus the search input on mount.
const Input = forwardRef<HTMLInputElement, InputProps>(({ label, name, className, ...props }, ref) => {
  return (
    <div>
      {label && <label htmlFor={name} className="block text-sm font-medium text-text-secondary mb-1">{label}</label>}
      <input
        ref={ref}
        id={name}
        name={name}
        className={`w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent transition ${className}`}
        {...props}
      />
    </div>
  );
});

Input.displayName = 'Input';

export default Input;