import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MethodBadge } from './MethodBadge';
import { HeadersEditor } from './HeadersEditor';
import { VariablesEditor } from './VariablesEditor';
import { ApiRequest } from '@/hooks/useTestSuites';
import { cn } from '@/lib/utils';

interface RequestEditorProps {
  request: ApiRequest;
  onUpdate: (updates: Partial<ApiRequest>) => void;
  onDelete: () => void;
  index: number;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export function RequestEditor({ request, onUpdate, onDelete, index }: RequestEditorProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
            <span className="text-sm font-medium text-muted-foreground w-6">
              #{index + 1}
            </span>
            <MethodBadge method={request.method} />
            <Input
              value={request.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="Request name"
              className="flex-1 h-8 text-sm font-medium border-0 bg-transparent px-0 focus-visible:ring-0"
            />
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
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {/* Method & URL */}
            <div className="flex gap-2">
              <Select
                value={request.method}
                onValueChange={(value) => onUpdate({ method: value })}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HTTP_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      <MethodBadge method={method} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={request.url}
                onChange={(e) => onUpdate({ url: e.target.value })}
                placeholder="https://api.example.com/endpoint or {{baseUrl}}/endpoint"
                className="flex-1 font-mono text-sm"
              />
            </div>

            {/* Headers */}
            <HeadersEditor
              headers={request.headers as Record<string, string>}
              onChange={(headers) => onUpdate({ headers })}
            />

            {/* Body (for POST, PUT, PATCH) */}
            {['POST', 'PUT', 'PATCH'].includes(request.method) && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Body (JSON)</label>
                <Textarea
                  value={request.body || ''}
                  onChange={(e) => onUpdate({ body: e.target.value })}
                  placeholder='{"key": "value"}'
                  className="font-mono text-sm min-h-[100px]"
                />
              </div>
            )}

            {/* Variables to Extract */}
            <VariablesEditor
              variables={request.variables_to_extract as Array<{ name: string; path: string }>}
              onChange={(variables) => onUpdate({ variables_to_extract: variables })}
            />

            {/* Validation Expression */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Validation Expression</label>
              <Input
                value={request.validation_expression || ''}
                onChange={(e) => onUpdate({ validation_expression: e.target.value })}
                placeholder='$.status === 200 && $.data.id !== null'
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use JSONPath expressions ($.data.field) and JavaScript comparison operators
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}