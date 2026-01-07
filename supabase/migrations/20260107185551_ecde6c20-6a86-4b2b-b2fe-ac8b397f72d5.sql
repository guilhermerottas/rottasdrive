-- Add new fields to obras table
ALTER TABLE public.obras 
ADD COLUMN foto_url TEXT,
ADD COLUMN endereco TEXT;