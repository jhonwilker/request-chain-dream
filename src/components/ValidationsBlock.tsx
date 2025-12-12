import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ValidationsEditor } from './ValidationsEditor';

// Helper to convert validation_expression (string | null) to array
export const parseValidations = (expression: string | null | undefined): string[] => {
  if (!expression) return [];
  try {
    const parsed = JSON.parse(expression);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Not JSON, treat as single expression
  }
  return expression ? [expression] : [];
};

// Helper to convert array back to string for storage
export const serializeValidations = (validations: string[], filterEmpty: boolean = false): string | null => {
  const items = filterEmpty ? validations.filter(v => v.trim()) : validations;
  if (items.length === 0) return null;
  if (items.length === 1 && filterEmpty) return items[0];
  return JSON.stringify(items);
};

interface ValidationsBlockProps {
  validationExpression: string | null;
  onChange: (expression: string | null) => void;
  onDelete: () => void;
}

export function ValidationsBlock({ validationExpression, onChange, onDelete }: ValidationsBlockProps) {
  const [isOpen, setIsOpen] = useState(true);
  const validations = parseValidations(validationExpression);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-foreground">Validations</span>
              <span className="text-xs text-muted-foreground">
                ({validations.filter(v => v.trim()).length} defined)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <ValidationsEditor
              validations={validations}
              onChange={(vals) => onChange(serializeValidations(vals))}
            />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
