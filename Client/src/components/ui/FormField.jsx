import { forwardRef, useId } from 'react';

// react-hook-form ke register() ke saath chalta hai: <FormField {...register('email')} />
const FormField = forwardRef(function FormField({ label, error, className = '', ...props }, ref) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        aria-invalid={error ? 'true' : 'false'}
        className={`block min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-green-500 dark:bg-slate-900 ${
          error ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
        }`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

export default FormField;
