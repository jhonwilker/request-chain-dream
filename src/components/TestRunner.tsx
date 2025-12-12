import { useState } from 'react';
import { Play, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RequestResult } from './RequestResult';
import { ApiRequest } from '@/hooks/useTestSuites';
import { validateExpression, extractVariables, replaceVariables } from '@/lib/jsonpath';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

interface RequestResultData {
  name: string;
  method: string;
  url: string;
  requestData: { headers?: Record<string, string>; body?: unknown };
  responseData: unknown;
  responseStatus: number;
  responseTime: number;
  validationPassed: boolean | null;
  validationExpression?: string;
  validationError?: string;
}

interface TestRunnerProps {
  testSuiteId: string;
  testSuiteName: string;
  requests: ApiRequest[];
}

export function TestRunner({ testSuiteId, testSuiteName, requests }: TestRunnerProps) {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<RequestResultData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [variables, setVariables] = useState<Record<string, unknown>>({});

  const runTests = async () => {
    if (!user || requests.length === 0) return;

    setIsRunning(true);
    setResults([]);
    setCurrentIndex(0);
    setVariables({});

    let currentVariables: Record<string, unknown> = {};
    const newResults: RequestResultData[] = [];

    const { data: execution, error: execError } = await supabase
      .from('test_executions')
      .insert({ test_suite_id: testSuiteId, user_id: user.id, status: 'running', total_requests: requests.length })
      .select()
      .single();

    if (execError) {
      toast.error('Failed to start test execution');
      setIsRunning(false);
      return;
    }

    for (let i = 0; i < requests.length; i++) {
      setCurrentIndex(i);
      const request = requests[i];

      let processedUrl = replaceVariables(request.url, currentVariables);
      
      // Append query params to URL
      const params = request.params as Record<string, string> | null;
      if (params && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (key) searchParams.append(key, replaceVariables(value, currentVariables));
        });
        const separator = processedUrl.includes('?') ? '&' : '?';
        processedUrl = `${processedUrl}${separator}${searchParams.toString()}`;
      }

      const processedBody = request.body ? replaceVariables(request.body, currentVariables) : null;

      const headers: Record<string, string> = { ...request.headers };
      if (processedBody && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
      Object.keys(headers).forEach(key => { headers[key] = replaceVariables(headers[key], currentVariables); });

      const startTime = performance.now();
      
      try {
        const response = await fetch(processedUrl, {
          method: request.method,
          headers,
          body: ['POST', 'PUT', 'PATCH'].includes(request.method) && processedBody ? processedBody : undefined,
        });

        const responseTime = Math.round(performance.now() - startTime);
        let responseData: unknown;
        const contentType = response.headers.get('content-type');
        responseData = contentType?.includes('application/json') ? await response.json() : await response.text();

        if (request.variables_to_extract && Array.isArray(request.variables_to_extract)) {
          const extracted = extractVariables(responseData, request.variables_to_extract);
          currentVariables = { ...currentVariables, ...extracted };
          setVariables(currentVariables);
        }

        const validation = validateExpression(request.validation_expression || '', responseData, response.status);

        const result: RequestResultData = {
          name: request.name, method: request.method, url: processedUrl,
          requestData: { headers, body: processedBody ? JSON.parse(processedBody) : undefined },
          responseData, responseStatus: response.status, responseTime,
          validationPassed: request.validation_expression ? validation.passed : null,
          validationExpression: request.validation_expression || undefined,
          validationError: validation.error,
        };

        newResults.push(result);
        setResults([...newResults]);

        await supabase.from('request_results').insert({
          execution_id: execution.id, api_request_id: request.id,
          request_data: result.requestData as Json, response_data: responseData as Json,
          response_status: response.status, response_time_ms: responseTime,
          validation_passed: result.validationPassed, validation_error: result.validationError,
        });

      } catch (error) {
        const responseTime = Math.round(performance.now() - startTime);
        const result: RequestResultData = {
          name: request.name, method: request.method, url: processedUrl,
          requestData: { headers, body: processedBody ? JSON.parse(processedBody) : undefined },
          responseData: { error: error instanceof Error ? error.message : 'Request failed' },
          responseStatus: 0, responseTime, validationPassed: false,
          validationExpression: request.validation_expression || undefined,
          validationError: error instanceof Error ? error.message : 'Request failed',
        };

        newResults.push(result);
        setResults([...newResults]);

        await supabase.from('request_results').insert({
          execution_id: execution.id, api_request_id: request.id,
          request_data: result.requestData as Json, response_data: result.responseData as Json,
          response_status: 0, response_time_ms: responseTime,
          validation_passed: false, validation_error: result.validationError,
        });
      }
    }

    const passedCount = newResults.filter(r => r.validationPassed === true).length;
    const failedCount = newResults.filter(r => r.validationPassed === false).length;

    await supabase.from('test_executions').update({
      status: failedCount > 0 ? 'failed' : 'passed',
      finished_at: new Date().toISOString(),
      passed_requests: passedCount, failed_requests: failedCount,
    }).eq('id', execution.id);

    setIsRunning(false);
    if (failedCount === 0 && passedCount > 0) toast.success('All tests passed!');
    else if (failedCount > 0) toast.error(`${failedCount} test(s) failed`);
  };

  const progress = requests.length > 0 ? ((currentIndex + (isRunning ? 1 : 0)) / requests.length) * 100 : 0;
  const passedCount = results.filter(r => r.validationPassed === true).length;
  const failedCount = results.filter(r => r.validationPassed === false).length;

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{testSuiteName}</CardTitle>
            <Button onClick={runTests} disabled={isRunning || requests.length === 0} className="gap-2">
              {isRunning ? <><Loader2 className="h-4 w-4 animate-spin" />Running...</> : <><Play className="h-4 w-4" />Run Tests</>}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Running request {currentIndex + 1} of {requests.length}</span>
                <span className="text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          {results.length > 0 && (
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-success" /><span className="text-sm font-medium">{passedCount} Passed</span></div>
              <div className="flex items-center gap-2"><XCircle className="h-5 w-5 text-destructive" /><span className="text-sm font-medium">{failedCount} Failed</span></div>
              <div className="flex items-center gap-2"><Clock className="h-5 w-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">Total: {results.reduce((sum, r) => sum + r.responseTime, 0)}ms</span></div>
            </div>
          )}
          {Object.keys(variables).length > 0 && (
            <div className="pt-2 border-t border-border">
              <p className="text-sm font-medium text-muted-foreground mb-2">Extracted Variables:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(variables).map(([key, value]) => (
                  <span key={key} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent/50 text-xs font-mono">
                    <span className="text-accent-foreground">{key}:</span>
                    <span className="text-muted-foreground truncate max-w-[150px]">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="space-y-4">{results.map((result, index) => <RequestResult key={index} {...result} index={index} />)}</div>
    </div>
  );
}