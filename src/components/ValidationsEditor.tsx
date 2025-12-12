import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ValidationsEditorProps {
  validations: string[];
  onChange: (validations: string[]) => void;
}

export function ValidationsEditor({ validations, onChange }: ValidationsEditorProps) {
  const addValidation = () => {
    onChange([...validations, '']);
  };

  const updateValidation = (index: number, value: string) => {
    const updated = [...validations];
    updated[index] = value;
    onChange(updated);
  };

  const removeValidation = (index: number) => {
    onChange(validations.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Validation Expressions</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addValidation}
          className="h-7 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Validation
        </Button>
      </div>
      
      {validations.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No validations defined</p>
      ) : (
        <div className="space-y-2">
          {validations.map((validation, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="$.status === 200 && $.data.id !== null"
                value={validation}
                onChange={(e) => updateValidation(index, e.target.value)}
                className="flex-1 h-9 text-sm font-mono"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeValidation(index)}
                className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {validations.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Use JSONPath expressions ($.data.field) and JavaScript comparison operators. All validations must pass.
        </p>
      )}
    </div>
  );
}
