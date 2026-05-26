-- Fase 3D: privatiza o bucket "arquivos".
-- URLs diretas deixam de funcionar; o app interno usa URLs assinadas via
-- src/lib/storage.ts. A página pública/edge function usa service role.

UPDATE storage.buckets SET public = false WHERE id = 'arquivos';

-- Restringe as policies do bucket arquivos a usuários autenticados.
DROP POLICY IF EXISTS "Acesso público download" ON storage.objects;
DROP POLICY IF EXISTS "Acesso público upload" ON storage.objects;
DROP POLICY IF EXISTS "Acesso público update" ON storage.objects;
DROP POLICY IF EXISTS "Acesso público delete" ON storage.objects;

CREATE POLICY "Arquivos download autenticado"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'arquivos');

CREATE POLICY "Arquivos upload autenticado"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'arquivos');

CREATE POLICY "Arquivos update autenticado"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'arquivos');

CREATE POLICY "Arquivos delete autenticado"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'arquivos');
