import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface ApiRequest {
  id: string;
  test_suite_id: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
  variables_to_extract: Array<{ name: string; path: string }>;
  validation_expression: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface TestSuite {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  api_requests?: ApiRequest[];
}

function parseApiRequest(raw: any): ApiRequest {
  return {
    ...raw,
    headers: (raw.headers && typeof raw.headers === 'object' && !Array.isArray(raw.headers)) 
      ? raw.headers as Record<string, string> 
      : {},
    variables_to_extract: Array.isArray(raw.variables_to_extract) 
      ? raw.variables_to_extract as Array<{ name: string; path: string }>
      : [],
  };
}

export function useTestSuites() {
  const { user } = useAuth();
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTestSuites = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('test_suites')
        .select('*, api_requests(*)')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      const formattedData: TestSuite[] = (data || []).map(suite => ({
        ...suite,
        api_requests: (suite.api_requests || [])
          .map(parseApiRequest)
          .sort((a, b) => a.order_index - b.order_index)
      }));
      
      setTestSuites(formattedData);
    } catch (error) {
      console.error('Error fetching test suites:', error);
      toast.error('Failed to load test suites');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTestSuites();
  }, [fetchTestSuites]);

  const createTestSuite = async (name: string, description?: string) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('test_suites')
        .insert({ user_id: user.id, name, description })
        .select()
        .single();

      if (error) throw error;
      await fetchTestSuites();
      toast.success('Test suite created');
      return data;
    } catch (error) {
      console.error('Error creating test suite:', error);
      toast.error('Failed to create test suite');
      return null;
    }
  };

  const updateTestSuite = async (id: string, updates: { name?: string; description?: string }) => {
    try {
      const { error } = await supabase.from('test_suites').update(updates).eq('id', id);
      if (error) throw error;
      await fetchTestSuites();
      toast.success('Test suite updated');
    } catch (error) {
      console.error('Error updating test suite:', error);
      toast.error('Failed to update test suite');
    }
  };

  const deleteTestSuite = async (id: string) => {
    try {
      const { error } = await supabase.from('test_suites').delete().eq('id', id);
      if (error) throw error;
      await fetchTestSuites();
      toast.success('Test suite deleted');
    } catch (error) {
      console.error('Error deleting test suite:', error);
      toast.error('Failed to delete test suite');
    }
  };

  const addApiRequest = async (testSuiteId: string, request: Partial<ApiRequest>) => {
    try {
      const suite = testSuites.find(s => s.id === testSuiteId);
      const maxOrder = suite?.api_requests?.reduce((max, r) => Math.max(max, r.order_index), -1) ?? -1;
      
      const { data, error } = await supabase
        .from('api_requests')
        .insert({
          test_suite_id: testSuiteId,
          name: request.name || 'New Request',
          method: request.method || 'GET',
          url: request.url || '',
          headers: (request.headers || {}) as Json,
          body: request.body || null,
          variables_to_extract: (request.variables_to_extract || []) as Json,
          validation_expression: request.validation_expression || null,
          order_index: maxOrder + 1
        })
        .select()
        .single();

      if (error) throw error;
      await fetchTestSuites();
      return data;
    } catch (error) {
      console.error('Error adding API request:', error);
      toast.error('Failed to add request');
      return null;
    }
  };

  const updateApiRequest = async (id: string, updates: Partial<ApiRequest>) => {
    try {
      const dbUpdates: any = { ...updates };
      if (updates.headers) dbUpdates.headers = updates.headers as Json;
      if (updates.variables_to_extract) dbUpdates.variables_to_extract = updates.variables_to_extract as Json;
      
      const { error } = await supabase.from('api_requests').update(dbUpdates).eq('id', id);
      if (error) throw error;
      await fetchTestSuites();
    } catch (error) {
      console.error('Error updating API request:', error);
      toast.error('Failed to update request');
    }
  };

  const deleteApiRequest = async (id: string) => {
    try {
      const { error } = await supabase.from('api_requests').delete().eq('id', id);
      if (error) throw error;
      await fetchTestSuites();
      toast.success('Request deleted');
    } catch (error) {
      console.error('Error deleting API request:', error);
      toast.error('Failed to delete request');
    }
  };

  const reorderRequests = async (testSuiteId: string, requestIds: string[]) => {
    try {
      for (let i = 0; i < requestIds.length; i++) {
        await supabase.from('api_requests').update({ order_index: i }).eq('id', requestIds[i]);
      }
      await fetchTestSuites();
    } catch (error) {
      console.error('Error reordering requests:', error);
      toast.error('Failed to reorder requests');
    }
  };

  return {
    testSuites, loading, createTestSuite, updateTestSuite, deleteTestSuite,
    addApiRequest, updateApiRequest, deleteApiRequest, reorderRequests, refetch: fetchTestSuites
  };
}