-- Função para verificar se usuário tem permissão de edição (admin ou editor)
CREATE OR REPLACE FUNCTION public.can_edit(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'editor')
  )
$$;

-- Atualizar RLS de arquivos - remover policy permissiva
DROP POLICY IF EXISTS "Acesso público arquivos" ON public.arquivos;

-- Viewers podem apenas visualizar
CREATE POLICY "Viewers can view arquivos"
ON public.arquivos
FOR SELECT
TO authenticated
USING (true);

-- Apenas admin e editor podem inserir
CREATE POLICY "Editors can insert arquivos"
ON public.arquivos
FOR INSERT
TO authenticated
WITH CHECK (public.can_edit(auth.uid()));

-- Apenas admin e editor podem atualizar
CREATE POLICY "Editors can update arquivos"
ON public.arquivos
FOR UPDATE
TO authenticated
USING (public.can_edit(auth.uid()));

-- Apenas admin e editor podem deletar
CREATE POLICY "Editors can delete arquivos"
ON public.arquivos
FOR DELETE
TO authenticated
USING (public.can_edit(auth.uid()));

-- Permitir admins gerenciar roles de outros usuários
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Permitir admins ver todos os perfis
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

CREATE POLICY "Users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

-- Permitir admins ver todos os roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view roles" ON public.user_roles;

CREATE POLICY "Users can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

-- Corrigir policies permissivas de obras e pastas
DROP POLICY IF EXISTS "Acesso público obras" ON public.obras;
DROP POLICY IF EXISTS "Acesso público pastas" ON public.pastas;

-- Obras - todos autenticados podem ver, apenas editores podem modificar
CREATE POLICY "Users can view obras"
ON public.obras
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Editors can insert obras"
ON public.obras
FOR INSERT
TO authenticated
WITH CHECK (public.can_edit(auth.uid()));

CREATE POLICY "Editors can update obras"
ON public.obras
FOR UPDATE
TO authenticated
USING (public.can_edit(auth.uid()));

CREATE POLICY "Editors can delete obras"
ON public.obras
FOR DELETE
TO authenticated
USING (public.can_edit(auth.uid()));

-- Pastas - todos autenticados podem ver, apenas editores podem modificar
CREATE POLICY "Users can view pastas"
ON public.pastas
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Editors can insert pastas"
ON public.pastas
FOR INSERT
TO authenticated
WITH CHECK (public.can_edit(auth.uid()));

CREATE POLICY "Editors can update pastas"
ON public.pastas
FOR UPDATE
TO authenticated
USING (public.can_edit(auth.uid()));

CREATE POLICY "Editors can delete pastas"
ON public.pastas
FOR DELETE
TO authenticated
USING (public.can_edit(auth.uid()));