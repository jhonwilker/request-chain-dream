import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HighlightedInput } from './HighlightedInput';

interface HeadersEditorProps {
  headers: Record<string, string>;
  onChange: (headers: Record<string, string>) => void;
}

export function HeadersEditor({ headers, onChange }: HeadersEditorProps) {
  const entries = Object.entries(headers);

  const addHeader = () => {
    onChange({ ...headers, '': '' });
  };

  const updateHeader = (oldKey: string, newKey: string, value: string) => {
    const newHeaders = { ...headers };
    if (oldKey !== newKey) {
      delete newHeaders[oldKey];
    }
    newHeaders[newKey] = value;
    onChange(newHeaders);
  };

  const removeHeader = (key: string) => {
    const newHeaders = { ...headers };
    delete newHeaders[key];
    onChange(newHeaders);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Headers</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addHeader}
          className="h-7 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Header
        </Button>
      </div>
      
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No headers defined</p>
      ) : (
        <div className="space-y-2">
          {entries.map(([key, value], index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Header name"
                value={key}
                onChange={(e) => updateHeader(key, e.target.value, value)}
                className="flex-1 h-9 text-sm font-mono"
              />
              <HighlightedInput
                placeholder="Value"
                value={value}
                onChange={(e) => updateHeader(key, key, e.target.value)}
                className="flex-1 h-9 text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeHeader(key)}
                className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}