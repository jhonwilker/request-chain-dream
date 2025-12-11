import { cn } from '@/lib/utils';

interface MethodBadgeProps {
  method: string;
  className?: string;
}

export function MethodBadge({ method, className }: MethodBadgeProps) {
  const methodClasses: Record<string, string> = {
    GET: 'method-get',
    POST: 'method-post',
    PUT: 'method-put',
    PATCH: 'method-patch',
    DELETE: 'method-delete',
  };

  return (
    <span className={cn('method-badge', methodClasses[method] || 'bg-muted text-muted-foreground', className)}>
      {method}
    </span>
  );
}