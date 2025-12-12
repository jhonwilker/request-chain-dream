import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { VariablesEditor } from './VariablesEditor';

interface ExtractVariablesBlockProps {
  variables: Array<{ name: string; path: string }>;
  onChange: (variables: Array<{ name: string; path: string }>) => void;
  onDelete: () => void;
}

export function ExtractVariablesBlock({ variables, onChange, onDelete }: ExtractVariablesBlockProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm font-medium text-foreground">Extract Variables</span>
              <span className="text-xs text-muted-foreground">
                ({variables.filter(v => v.name && v.path).length} defined)
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
            <VariablesEditor variables={variables} onChange={onChange} />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
