import React, { forwardRef } from 'react';
/**
 * Input Component — form input with label + error + icon
 */
export function Input({
  label,
  error,
  iconLeft,
  iconRight,
  className = '',
  ...props
}) {
  return (
    <div className="flex flex-col gap-xs">
      {label && (
        <label className="text-small font-medium text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        {iconLeft && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none">
            {iconLeft}
          </span>
        )}
        <input
          className={`
            form-input
            ${iconLeft  ? 'pl-10' : ''}
            ${iconRight ? 'pr-10' : ''}
            ${error     ? 'error' : ''}
            ${className}
          `}
          {...props}
        />
        {iconRight && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light">
            {iconRight}
          </span>
        )}
      </div>
      {error && (
        <p className="text-[14px] text-red-500">{error}</p>
      )}
    </div>
  )
}

/**
 * Textarea Component
 */
export const Textarea = forwardRef(({
  label,
  error,
  rows = 4,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="flex flex-col gap-xs">
      {label && (
        <label className="text-small font-medium text-secondary">
          {label}
        </label>
      )}
      <textarea
        ref={ref} // আসল textarea-তে ref কানেক্ট করা হয়েছে
        rows={rows}
        className={`
          form-input resize-none
          ${error ? 'error' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-[14px] text-red-500">{error}</p>
      )}
    </div>
  )
});

/**
 * Select Component
 */
export function Select({
  label,
  error,
  options = [],
  placeholder,
  className = '',
  ...props
}) {
  return (
    <div className="flex flex-col gap-xs">
      {label && (
        <label className="text-small font-medium text-secondary">
          {label}
        </label>
      )}
      <select
        className={`
          form-input appearance-none cursor-pointer
          ${error ? 'error' : ''}
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-[14px] text-red-500">{error}</p>
      )}
    </div>
  )
}
