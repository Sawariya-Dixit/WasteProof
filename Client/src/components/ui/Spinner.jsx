import { Loader2 } from 'lucide-react';

export default function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />;
}

export function FullPageSpinner() {
  return (
    <div className="flex h-full items-center justify-center" role="status" aria-label="Loading">
      <Spinner className="h-8 w-8 text-green-600" />
    </div>
  );
}
