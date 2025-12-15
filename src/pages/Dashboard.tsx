import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemeToggle } from '@/components/ThemeToggle';
import { TestSuiteCard } from '@/components/TestSuiteCard';
import { CreateTestSuiteDialog } from '@/components/CreateTestSuiteDialog';
import { RequestEditor } from '@/components/RequestEditor';
import { TestRunner } from '@/components/TestRunner';

import { useAuth } from '@/hooks/useAuth';
import { useTestSuites, ApiRequest } from '@/hooks/useTestSuites';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { validateExpression, replaceVariables, extractVariables } from '@/lib/jsonpath';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export interface SingleRunResult {
  name: string;
  method: string;
  url: string;
  requestData: { headers?: Record<string, string>; body?: unknown };
  responseData: { headers?: Record<string, string>; body?: unknown };
  responseStatus: number;
  responseTime: number;
  validationPassed: boolean | null;
  validationExpression?: string;
  validationError?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const {
    testSuites,
    loading: suitesLoading,
    createTestSuite,
    updateTestSuite,
    deleteTestSuite,
    addApiRequest,
    updateApiRequest,
    deleteApiRequest,
  } = useTestSuites();

  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('editor');
  const [runningRequestId, setRunningRequestId] = useState<string | null>(null);
  const [requestResults, setRequestResults] = useState<Record<string, SingleRunResult>>({});
  const [extractedVariables, setExtractedVariables] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (testSuites.length > 0 && !selectedSuiteId) {
      setSelectedSuiteId(testSuites[0].id);
    }
  }, [testSuites, selectedSuiteId]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleRunSingleRequest = async (request: ApiRequest) => {
    setRunningRequestId(request.id);

    let processedUrl = replaceVariables(request.url, extractedVariables);
    
    // Append query params to URL
    if (request.params && Object.keys(request.params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(request.params).forEach(([key, value]) => {
        if (key) searchParams.append(key, replaceVariables(value, extractedVariables));
      });
      const separator = processedUrl.includes('?') ? '&' : '?';
      processedUrl = `${processedUrl}${separator}${searchParams.toString()}`;
    }

    const processedBody = request.body ? replaceVariables(request.body, extractedVariables) : null;

    const headers: Record<string, string> = {};
    if (request.headers) {
      Object.entries(request.headers as Record<string, string>).forEach(([key, value]) => {
        headers[key] = replaceVariables(value, extractedVariables);
      });
    }
    if (processedBody && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

    const startTime = performance.now();

    try {
      const response = await fetch(processedUrl, {
        method: request.method,
        headers,
        body: ['POST', 'PUT', 'PATCH'].includes(request.method) && processedBody ? processedBody : undefined,
      });

      const responseTime = Math.round(performance.now() - startTime);
      
      // Capture response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Parse response body
      const contentType = response.headers.get('content-type');
      let responseBody: unknown;
      responseBody = contentType?.includes('application/json') ? await response.json() : await response.text();

      // Extract variables from response
      const variablesToExtract = (request.variables_to_extract as Array<{ name: string; path: string }>) || [];
      if (variablesToExtract.length > 0) {
        const newVars = extractVariables(responseBody, variablesToExtract);
        setExtractedVariables(prev => ({ ...prev, ...newVars }));
      }

      const validation = validateExpression(request.validation_expression || '', responseBody, response.status);

      const result: SingleRunResult = {
        name: request.name,
        method: request.method,
        url: processedUrl,
        requestData: { headers, body: processedBody ? JSON.parse(processedBody) : undefined },
        responseData: { headers: responseHeaders, body: responseBody },
        responseStatus: response.status,
        responseTime,
        validationPassed: request.validation_expression ? validation.passed : null,
        validationExpression: request.validation_expression || undefined,
        validationError: validation.error,
      };

      setRequestResults(prev => ({ ...prev, [request.id]: result }));

      if (result.validationPassed === true) {
        toast.success(`${request.name} passed!`);
      } else if (result.validationPassed === false) {
        toast.error(`${request.name} failed`);
      } else {
        toast.info(`${request.name} completed (${response.status})`);
      }
    } catch (error) {
      const responseTime = Math.round(performance.now() - startTime);
      const result: SingleRunResult = {
        name: request.name,
        method: request.method,
        url: processedUrl,
        requestData: { headers, body: processedBody ? JSON.parse(processedBody) : undefined },
        responseData: { headers: {}, body: { error: error instanceof Error ? error.message : 'Request failed' } },
        responseStatus: 0,
        responseTime,
        validationPassed: false,
        validationExpression: request.validation_expression || undefined,
        validationError: error instanceof Error ? error.message : 'Request failed',
      };

      setRequestResults(prev => ({ ...prev, [request.id]: result }));
      toast.error(`${request.name} failed: ${result.validationError}`);
    } finally {
      setRunningRequestId(null);
    }
  };

  const selectedSuite = testSuites.find(s => s.id === selectedSuiteId);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (suitesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-80 border-r border-border bg-card/50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" />
                  <polygon points="18 2 22 6 12 16 8 16 8 12 18 2" />
                </svg>
              </div>
              <h1 className="font-semibold text-foreground">API Tester</h1>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-9 w-9">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CreateTestSuiteDialog onCreate={createTestSuite} />
        </div>

        {/* Test Suites List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {testSuites.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No test suites yet</p>
                <p className="text-xs text-muted-foreground mt-1">Create one to get started</p>
              </div>
            ) : (
              testSuites.map((suite) => (
                <TestSuiteCard
                  key={suite.id}
                  suite={suite}
                  isSelected={selectedSuiteId === suite.id}
                  onSelect={() => setSelectedSuiteId(suite.id)}
                  onUpdate={(updates) => updateTestSuite(suite.id, updates)}
                  onDelete={() => {
                    deleteTestSuite(suite.id);
                    if (selectedSuiteId === suite.id) {
                      setSelectedSuiteId(null);
                    }
                  }}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* User Info */}
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {selectedSuite ? (
          <>
            <div className="p-4 border-b border-border bg-card/30">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{selectedSuite.name}</h2>
                  {selectedSuite.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{selectedSuite.description}</p>
                  )}
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="editor">Editor</TabsTrigger>
                    <TabsTrigger value="runner">Runner</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6">
                {activeTab === 'editor' ? (
                  <div className="space-y-4 max-w-full overflow-x-hidden">
                    {/* Extracted Variables Panel */}
                    {Object.keys(extractedVariables).length > 0 && (
                      <div className="bg-muted/50 rounded-lg p-4 border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-foreground">Extracted Variables</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExtractedVariables({})}
                            className="h-7 text-xs text-muted-foreground hover:text-destructive"
                          >
                            Clear All
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(extractedVariables).map(([name, value]) => (
                            <Badge key={name} variant="secondary" className="font-mono text-xs">
                              <span className="text-primary">{`{{${name}}}`}</span>
                              <span className="mx-1 text-muted-foreground">=</span>
                              <span className="max-w-[200px] truncate">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedSuite.api_requests?.map((request, index) => (
                      <RequestEditor
                        key={request.id}
                        request={request}
                        index={index}
                        onUpdate={(updates) => updateApiRequest(request.id, updates)}
                        onDelete={() => deleteApiRequest(request.id)}
                        onRun={handleRunSingleRequest}
                        isRunning={runningRequestId === request.id}
                        runResult={requestResults[request.id]}
                      />
                    ))}

                    {/* Add Request Button */}
                    <Button
                      variant="outline"
                      onClick={() => addApiRequest(selectedSuite.id, { name: 'New Request' })}
                      className="w-full border-dashed"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Request
                    </Button>

                  </div>
                ) : (
                  <TestRunner
                    testSuiteId={selectedSuite.id}
                    testSuiteName={selectedSuite.name}
                    requests={selectedSuite.api_requests || []}
                  />
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" />
                  <polygon points="18 2 22 6 12 16 8 16 8 12 18 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">Select a Test Suite</h3>
              <p className="text-sm text-muted-foreground">
                Choose a test suite from the sidebar or create a new one
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}