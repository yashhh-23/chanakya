import React from 'react'

export interface ValidationErrorProps {
  message?: string | null
}

export const ValidationError: React.FC<ValidationErrorProps> = ({ message }) => {
  if (!message) return null

  return (
    <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-500 dark:text-rose-400 animate-fadeIn">
      <svg
        className="h-3.5 w-3.5 shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <span>{message}</span>
    </div>
  )
}
