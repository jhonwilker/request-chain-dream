import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ThemeToggle';
import { TestSuiteCard } from '@/components/TestSuiteCard';
import { CreateTestSuiteDialog } from '@/components/CreateTestSuiteDialog';
import { RequestEditor } from '@/components/RequestEditor';
import { TestRunner } from '@/components/TestRunner';
import { useAuth } from '@/hooks/useAuth';
import { useTestSuites, ApiRequest } from '@/hooks/useTestSuites';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
                  <div className="space-y-4">
                    {selectedSuite.api_requests?.map((request, index) => (
                      <RequestEditor
                        key={request.id}
                        request={request}
                        index={index}
                        onUpdate={(updates) => updateApiRequest(request.id, updates)}
                        onDelete={() => deleteApiRequest(request.id)}
                      />
                    ))}
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