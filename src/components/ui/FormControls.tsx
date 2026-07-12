/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode, useId, memo} from 'react';

// ==========================================
// FormRow Wrapper
// ==========================================
interface FormRowProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  id?: string;
}

export const FormRow = memo(function FormRow({label, error, required, children, id}: FormRowProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full mb-4">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-text-base/90 select-none flex items-center gap-1">
          {label}
          {required && <span className="text-red-500" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        {children}
      </div>
      {error && (
        <p className="text-xs text-red-500 font-medium animate-slide-in" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

// ==========================================
// TextInput Component
// ==========================================
interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({className = '', error, id, ...props}, ref) => {
    const defaultId = useId();
    const inputId = id || defaultId;

    return (
      <input
        ref={ref}
        id={inputId}
        className={`w-full h-10 px-3 py-2 bg-bg-surface border ${
          error ? 'border-red-500 focus-visible:outline-red-500' : 'border-border-base focus-visible:outline-primary-base'
        } rounded-md text-sm text-text-base placeholder:text-text-muted/60 bg-transparent transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
    );
  }
);
TextInput.displayName = 'TextInput';

// ==========================================
// NumberInput Component
// ==========================================
interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  error?: boolean;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({className = '', error, id, ...props}, ref) => {
    const defaultId = useId();
    const inputId = id || defaultId;

    return (
      <input
        ref={ref}
        type="number"
        id={inputId}
        className={`w-full h-10 px-3 py-2 bg-bg-surface border ${
          error ? 'border-red-500 focus-visible:outline-red-500' : 'border-border-base focus-visible:outline-primary-base'
        } rounded-md text-sm text-text-base placeholder:text-text-muted/60 bg-transparent transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
    );
  }
);
NumberInput.displayName = 'NumberInput';

// ==========================================
// DateInput Component
// ==========================================
interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  error?: boolean;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({className = '', error, id, ...props}, ref) => {
    const defaultId = useId();
    const inputId = id || defaultId;

    return (
      <input
        ref={ref}
        type="date"
        id={inputId}
        className={`w-full h-10 px-3 py-2 bg-bg-surface border ${
          error ? 'border-red-500 focus-visible:outline-red-500' : 'border-border-base focus-visible:outline-primary-base'
        } rounded-md text-sm text-text-base placeholder:text-text-muted/60 bg-transparent transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
    );
  }
);
DateInput.displayName = 'DateInput';

// ==========================================
// TextArea Component
// ==========================================
interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({className = '', error, id, ...props}, ref) => {
    const defaultId = useId();
    const inputId = id || defaultId;

    return (
      <textarea
        ref={ref}
        id={inputId}
        className={`w-full min-h-[80px] px-3 py-2 bg-bg-surface border ${
          error ? 'border-red-500 focus-visible:outline-red-500' : 'border-border-base focus-visible:outline-primary-base'
        } rounded-md text-sm text-text-base placeholder:text-text-muted/60 bg-transparent transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
    );
  }
);
TextArea.displayName = 'TextArea';

// ==========================================
// SelectBox Component
// ==========================================
interface SelectBoxProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: {value: string; label: string}[];
}

export const SelectBox = forwardRef<HTMLSelectElement, SelectBoxProps>(
  ({className = '', error, options, id, ...props}, ref) => {
    const defaultId = useId();
    const inputId = id || defaultId;

    return (
      <select
        ref={ref}
        id={inputId}
        className={`w-full h-10 px-3 py-2 bg-bg-surface border ${
          error ? 'border-red-500 focus-visible:outline-red-500' : 'border-border-base focus-visible:outline-primary-base'
        } rounded-md text-sm text-text-base bg-transparent transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-bg-surface text-text-base">
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);
SelectBox.displayName = 'SelectBox';

// ==========================================
// Checkbox Component
// ==========================================
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({className = '', label, id, ...props}, ref) => {
    const defaultId = useId();
    const checkboxId = id || defaultId;

    return (
      <div className="flex items-center gap-2 py-1 select-none">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={`h-4.5 w-4.5 rounded border border-border-base text-primary-base focus:ring-primary-base outline-none cursor-pointer accent-primary-base ${className}`}
          {...props}
        />
        {label && (
          <label htmlFor={checkboxId} className="text-xs font-medium text-text-base cursor-pointer">
            {label}
          </label>
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

// ==========================================
// Switch Component (Toggle Switch)
// ==========================================
interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({className = '', label, id, checked, onChange, ...props}, ref) => {
    const defaultId = useId();
    const switchId = id || defaultId;

    return (
      <div className="flex items-center gap-3 py-1 select-none cursor-pointer">
        <div className="relative inline-flex items-center">
          <input
            ref={ref}
            type="checkbox"
            id={switchId}
            checked={checked}
            onChange={onChange}
            className="sr-only peer"
            {...props}
          />
          <div className="w-10 h-5.5 bg-border-base rounded-full peer peer-focus:ring-2 peer-focus:ring-primary-base peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-status-available"></div>
        </div>
        {label && (
          <label htmlFor={switchId} className="text-xs font-medium text-text-base cursor-pointer">
            {label}
          </label>
        )}
      </div>
    );
  }
);
Switch.displayName = 'Switch';
