/**
 * Input Component
 * Campo de entrada reutilizable
 */

import React, { InputHTMLAttributes, useRef, useEffect } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useRef(`input-${Math.random().toString(36).substring(2, 11)}`).current;

  useEffect(() => {
    const input = inputRef.current;
    if (input && props.type === 'number') {
      // Prevenir que la rueda del mouse cambie el valor
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
      };

      input.addEventListener('wheel', handleWheel, { passive: false });

      return () => {
        input.removeEventListener('wheel', handleWheel);
      };
    }
  }, [props.type]);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        id={inputId}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
          error ? "border-red-500" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = "", ...props }: TextareaProps) {
  const textareaId = useRef(`textarea-${Math.random().toString(36).substring(2, 11)}`).current;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
          error ? "border-red-500" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}