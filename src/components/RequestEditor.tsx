import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Trash2, GripVertical, Save, Play, Loader2, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MethodBadge } from './MethodBadge';
import { HeadersEditor } from './HeadersEditor';
import { ParametersEditor } from './ParametersEditor';
import { JsonViewer } from './JsonViewer';
import { ValidationResult } from './ValidationResult';
import { ApiRequest } from '@/hooks/useTestSuites';
import { SingleRunResult } from '@/pages/Dashboard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface RequestEditorProps {
  request: ApiRequest;
  onUpdate: (updates: Partial<ApiRequest>) => void;
  onDelete: () => void;
  onRun?: (request: ApiRequest) => void;
  index: number;
  isRunning?: boolean;
  runResult?: SingleRunResult;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export function RequestEditor({ request, onUpdate, onDelete, onRun, index, isRunning, runResult }: RequestEditorProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [localRequest, setLocalRequest] = useState<ApiRequest>(request);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local state when request prop changes (e.g., after save)
  useEffect(() => {
    setLocalRequest(request);
    setHasChanges(false);
  }, [request]);

  const updateLocal = (updates: Partial<ApiRequest>) => {
    setLocalRequest(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate(localRequest);
    setHasChanges(false);
    toast.success('Request saved');
  };

  const handleRun = () => {
    // Save before running if there are changes
    if (hasChanges) {
      onUpdate(localRequest);
      setHasChanges(false);
    }
    onRun?.(localRequest);
  };

  return (
    <Card className={cn(
      "border-border/50 bg-card/50 backdrop-blur-sm transition-all",
      hasChanges && "ring-2 ring-primary/30"
    )}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
            <span className="text-sm font-medium text-muted-foreground w-6">
              #{index + 1}
            </span>
            <MethodBadge method={localRequest.method} />
            <Input
              value={localRequest.name}
              onChange={(e) => updateLocal({ name: e.target.value })}
              placeholder="Request name"
              className="flex-1 h-8 text-sm font-medium border-0 bg-transparent px-0 focus-visible:ring-0"
            />
            <div className="flex items-center gap-1">
              {hasChanges && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  className="h-8 gap-1"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save
                </Button>
              )}
              {onRun && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRun}
                  disabled={isRunning}
                  className="h-8 gap-1"
                >
                  {isRunning ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  Run
                </Button>
              )}
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
          <CardContent className="space-y-4 pt-0">
            {/* Method & URL */}
            <div className="flex gap-2">
              <Select
                value={localRequest.method}
                onValueChange={(value) => updateLocal({ method: value })}
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
                value={localRequest.url}
                onChange={(e) => updateLocal({ url: e.target.value })}
                placeholder="https://api.example.com/endpoint or {{baseUrl}}/endpoint"
                className="flex-1 font-mono text-sm"
              />
            </div>

            {/* Headers */}
            <HeadersEditor
              headers={localRequest.headers as Record<string, string>}
              onChange={(headers) => updateLocal({ headers })}
            />

            {/* Query Parameters */}
            <ParametersEditor
              params={localRequest.params as Record<string, string>}
              onChange={(params) => updateLocal({ params })}
            />

            {/* Body (for POST, PUT, PATCH) */}
            {['POST', 'PUT', 'PATCH'].includes(localRequest.method) && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Body (JSON)</label>
                <Textarea
                  value={localRequest.body || ''}
                  onChange={(e) => updateLocal({ body: e.target.value })}
                  placeholder='{"key": "value"}'
                  className="font-mono text-sm min-h-[100px] max-h-[200px] resize-none"
                />
              </div>
            )}

            {/* Run Result */}
            {runResult && (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Last Run</span>
                    {runResult.validationPassed !== null && (
                      runResult.validationPassed ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className={cn(
                      'font-mono font-medium',
                      runResult.responseStatus >= 200 && runResult.responseStatus < 300 
                        ? 'text-success' 
                        : runResult.responseStatus >= 400 
                          ? 'text-destructive' 
                          : 'text-warning'
                    )}>
                      {runResult.responseStatus}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {runResult.responseTime}ms
                    </span>
                  </div>
                </div>

                <div className="max-h-[300px] overflow-auto">
                  <JsonViewer
                    data={runResult.responseData}
                    label="Response"
                    variant="response"
                  />
                </div>

                <ValidationResult
                  passed={runResult.validationPassed}
                  expression={runResult.validationExpression}
                  error={runResult.validationError}
                />
              </div>
            )}

          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}