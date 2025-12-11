import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationResultProps {
  passed: boolean | null;
  expression?: string;
  error?: string;
  className?: string;
}

export function ValidationResult({ passed, expression, error, className }: ValidationResultProps) {
  if (passed === null) {
    return (
      <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg bg-muted', className)}>
        <AlertCircle className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No validation defined</span>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-lg',
        passed ? 'validation-passed' : 'validation-failed',
        className
      )}
    >
      {passed ? (
        <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
      ) : (
        <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-medium', passed ? 'text-success' : 'text-destructive')}>
            {passed ? 'Passed' : 'Failed'}
          </span>
        </div>
        {expression && (
          <code className="block mt-1 text-xs text-muted-foreground font-mono break-all">
            {expression}
          </code>
        )}
        {error && (
          <p className="mt-1 text-xs text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}