import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface Parameter {
  key: string;
  value: string;
}

interface ParametersEditorProps {
  params: Record<string, string> | null | undefined;
  onChange: (params: Record<string, string>) => void;
}

export function ParametersEditor({ params, onChange }: ParametersEditorProps) {
  const [isOpen, setIsOpen] = useState(true);

  const paramsList: Parameter[] = params
    ? Object.entries(params).map(([key, value]) => ({ key, value }))
    : [];

  const updateParam = (index: number, field: 'key' | 'value', newValue: string) => {
    const updated = [...paramsList];
    updated[index] = { ...updated[index], [field]: newValue };
    onChange(Object.fromEntries(updated.map((p) => [p.key, p.value])));
  };

  const addParam = () => {
    const updated = [...paramsList, { key: '', value: '' }];
    onChange(Object.fromEntries(updated.map((p) => [p.key, p.value])));
  };

  const removeParam = (index: number) => {
    const updated = paramsList.filter((_, i) => i !== index);
    onChange(Object.fromEntries(updated.map((p) => [p.key, p.value])));
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors">
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
        Query Parameters
        {paramsList.length > 0 && (
          <span className="text-xs text-muted-foreground">({paramsList.length})</span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 space-y-2">
        {paramsList.map((param, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={param.key}
              onChange={(e) => updateParam(index, 'key', e.target.value)}
              placeholder="key"
              className="flex-1 font-mono text-sm h-9"
            />
            <Input
              value={param.value}
              onChange={(e) => updateParam(index, 'value', e.target.value)}
              placeholder="value or {{variable}}"
              className="flex-1 font-mono text-sm h-9"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeParam(index)}
              className="h-9 w-9 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={addParam}
          className="text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Parameter
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
}