import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MethodBadge } from './MethodBadge';
import { JsonViewer } from './JsonViewer';
import { ValidationResult } from './ValidationResult';
import { cn } from '@/lib/utils';

interface RequestResultProps {
  name: string;
  method: string;
  url: string;
  requestData: {
    headers?: Record<string, string>;
    body?: unknown;
  };
  responseData: unknown;
  responseStatus: number;
  responseTime: number;
  validationPassed: boolean | null;
  validationExpression?: string;
  validationError?: string;
  index: number;
}

export function RequestResult({
  name,
  method,
  url,
  requestData,
  responseData,
  responseStatus,
  responseTime,
  validationPassed,
  validationExpression,
  validationError,
  index,
}: RequestResultProps) {
  const statusColor = responseStatus >= 200 && responseStatus < 300 
    ? 'text-success' 
    : responseStatus >= 400 
      ? 'text-destructive' 
      : 'text-warning';

  return (
    <Card 
      className={cn(
        'border-border/50 animate-fade-in',
        validationPassed === true && 'border-l-4 border-l-success',
        validationPassed === false && 'border-l-4 border-l-destructive'
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
            <MethodBadge method={method} />
            <span className="font-medium text-foreground">{name}</span>
            {validationPassed !== null && (
              validationPassed ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className={cn('font-mono font-medium', statusColor)}>
              {responseStatus}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {responseTime}ms
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground font-mono mt-1 truncate">{url}</p>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Request Data */}
        <JsonViewer
          data={requestData}
          label="Request"
          variant="request"
        />

        {/* Response Data */}
        <JsonViewer
          data={responseData}
          label="Response"
          variant="response"
        />

        {/* Validation Result */}
        <ValidationResult
          passed={validationPassed}
          expression={validationExpression}
          error={validationError}
        />
      </CardContent>
    </Card>
  );
}