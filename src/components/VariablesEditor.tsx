import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Variable {
  name: string;
  path: string;
}

interface VariablesEditorProps {
  variables: Variable[];
  onChange: (variables: Variable[]) => void;
}

export function VariablesEditor({ variables, onChange }: VariablesEditorProps) {
  const addVariable = () => {
    onChange([...variables, { name: '', path: '' }]);
  };

  const updateVariable = (index: number, field: 'name' | 'path', value: string) => {
    const updated = [...variables];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeVariable = (index: number) => {
    onChange(variables.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Response Variable Mapping</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addVariable}
          className="h-7 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Variable
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Extract values from the response to use in subsequent requests. Use JSONPath syntax (e.g., $.data.id)
      </p>
      
      {variables.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No variables defined</p>
      ) : (
        <div className="space-y-2">
          {variables.map((variable, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Variable name"
                value={variable.name}
                onChange={(e) => updateVariable(index, 'name', e.target.value)}
                className="flex-1 h-9 text-sm font-mono"
              />
              <Input
                placeholder="JSONPath (e.g., $.data.id)"
                value={variable.path}
                onChange={(e) => updateVariable(index, 'path', e.target.value)}
                className="flex-[2] h-9 text-sm font-mono"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeVariable(index)}
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