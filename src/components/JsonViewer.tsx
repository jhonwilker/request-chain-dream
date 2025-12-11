import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface JsonViewerProps {
  data: unknown;
  label?: string;
  variant?: 'request' | 'response';
  className?: string;
  maxHeight?: string;
}

export function JsonViewer({ data, label, variant = 'request', className, maxHeight = '300px' }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bgClass = variant === 'request' ? 'bg-request-bg' : 'bg-response-bg';
  const borderClass = variant === 'request' ? 'border-request/30' : 'border-response/30';
  const labelClass = variant === 'request' ? 'text-request' : 'text-response';

  return (
    <div className={cn('rounded-lg border', bgClass, borderClass, className)}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-inherit">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn('flex items-center gap-2 text-sm font-medium', labelClass)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {label}
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className="h-7 w-7"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-success" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      {!collapsed && (
        <div 
          className="p-3 overflow-auto scrollbar-thin"
          style={{ maxHeight }}
        >
          <pre className="json-viewer text-foreground">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}