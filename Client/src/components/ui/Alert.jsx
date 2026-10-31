const styles = {
  error: 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200',
  success: 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200',
};

export default function Alert({ type = 'error', children }) {
  if (!children) return null;
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`rounded-lg p-3 text-sm ${styles[type]}`}
    >
      {children}
    </div>
  );
}
