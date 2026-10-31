import Spinner from './Spinner';

const variants = {
  primary: 'bg-green-600 text-white hover:bg-green-700 disabled:bg-green-600/60',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
  outline:
    'border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800',
};

// loading=true par button disable hota hai (double submit nahi hoga)
export default function Button({
  variant = 'primary',
  loading = false,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      disabled={loading || props.disabled}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}
