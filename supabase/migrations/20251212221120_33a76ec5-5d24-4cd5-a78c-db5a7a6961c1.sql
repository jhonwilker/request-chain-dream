-- Add params column to api_requests table
ALTER TABLE public.api_requests 
ADD COLUMN params JSONB DEFAULT NULL;