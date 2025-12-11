-- Create table for API test suites
CREATE TABLE public.test_suites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for API requests within test suites
CREATE TABLE public.api_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_suite_id UUID NOT NULL REFERENCES public.test_suites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  url TEXT NOT NULL,
  headers JSONB DEFAULT '{}',
  body TEXT,
  variables_to_extract JSONB DEFAULT '[]',
  validation_expression TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for test execution history
CREATE TABLE public.test_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_suite_id UUID NOT NULL REFERENCES public.test_suites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE,
  total_requests INTEGER DEFAULT 0,
  passed_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0
);

-- Create table for individual request results within an execution
CREATE TABLE public.request_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id UUID NOT NULL REFERENCES public.test_executions(id) ON DELETE CASCADE,
  api_request_id UUID NOT NULL REFERENCES public.api_requests(id) ON DELETE CASCADE,
  request_data JSONB,
  response_data JSONB,
  response_status INTEGER,
  response_time_ms INTEGER,
  validation_passed BOOLEAN,
  validation_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.test_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for test_suites
CREATE POLICY "Users can view their own test suites"
ON public.test_suites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own test suites"
ON public.test_suites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own test suites"
ON public.test_suites FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own test suites"
ON public.test_suites FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for api_requests (based on test_suite ownership)
CREATE POLICY "Users can view requests from their test suites"
ON public.api_requests FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.test_suites
  WHERE test_suites.id = api_requests.test_suite_id
  AND test_suites.user_id = auth.uid()
));

CREATE POLICY "Users can create requests in their test suites"
ON public.api_requests FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.test_suites
  WHERE test_suites.id = api_requests.test_suite_id
  AND test_suites.user_id = auth.uid()
));

CREATE POLICY "Users can update requests in their test suites"
ON public.api_requests FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.test_suites
  WHERE test_suites.id = api_requests.test_suite_id
  AND test_suites.user_id = auth.uid()
));

CREATE POLICY "Users can delete requests from their test suites"
ON public.api_requests FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.test_suites
  WHERE test_suites.id = api_requests.test_suite_id
  AND test_suites.user_id = auth.uid()
));

-- RLS Policies for test_executions
CREATE POLICY "Users can view their own executions"
ON public.test_executions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own executions"
ON public.test_executions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own executions"
ON public.test_executions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own executions"
ON public.test_executions FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for request_results (based on execution ownership)
CREATE POLICY "Users can view results from their executions"
ON public.request_results FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.test_executions
  WHERE test_executions.id = request_results.execution_id
  AND test_executions.user_id = auth.uid()
));

CREATE POLICY "Users can create results in their executions"
ON public.request_results FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.test_executions
  WHERE test_executions.id = request_results.execution_id
  AND test_executions.user_id = auth.uid()
));

CREATE POLICY "Users can delete results from their executions"
ON public.request_results FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.test_executions
  WHERE test_executions.id = request_results.execution_id
  AND test_executions.user_id = auth.uid()
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_test_suites_updated_at
BEFORE UPDATE ON public.test_suites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_requests_updated_at
BEFORE UPDATE ON public.api_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();