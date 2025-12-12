import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ParametersEditorProps {
  params: Record<string, string> | null | undefined;
  onChange: (params: Record<string, string>) => void;
}

export function ParametersEditor({ params, onChange }: ParametersEditorProps) {
  const entries = params ? Object.entries(params) : [];

  const addParam = () => {
    onChange({ ...(params || {}), '': '' });
  };

  const updateParam = (oldKey: string, newKey: string, value: string) => {
    const newParams = { ...(params || {}) };
    if (oldKey !== newKey) {
      delete newParams[oldKey];
    }
    newParams[newKey] = value;
    onChange(newParams);
  };

  const removeParam = (key: string) => {
    const newParams = { ...(params || {}) };
    delete newParams[key];
    onChange(newParams);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Query Parameters</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addParam}
          className="h-7 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Parameter
        </Button>
      </div>
      
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No parameters defined</p>
      ) : (
        <div className="space-y-2">
          {entries.map(([key, value], index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Key"
                value={key}
                onChange={(e) => updateParam(key, e.target.value, value)}
                className="flex-1 h-9 text-sm font-mono"
              />
              <Input
                placeholder="Value or {{variable}}"
                value={value}
                onChange={(e) => updateParam(key, key, e.target.value)}
                className="flex-1 h-9 text-sm font-mono"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeParam(key)}
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
