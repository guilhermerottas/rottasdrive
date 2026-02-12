
-- Add soft-delete columns to pastas table
ALTER TABLE public.pastas
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN deleted_by UUID DEFAULT NULL;
