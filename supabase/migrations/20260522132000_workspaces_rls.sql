-- Fase 1: funções auxiliares e RLS dos Workspaces.
-- Todas as checagens cruzadas passam por funções SECURITY DEFINER (evita recursão de policy).

-- Usuário é membro do workspace?
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_membros
    WHERE user_id = _user_id AND workspace_id = _workspace_id
  );
$$;

-- Usuário pode acessar a obra? (membership do workspace + obra_restrictions; admin/editor passam)
CREATE OR REPLACE FUNCTION public.can_access_obra(_user_id uuid, _obra_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.can_edit(_user_id)
    OR (
      EXISTS (
        SELECT 1 FROM public.obras o
        WHERE o.id = _obra_id
          AND public.is_workspace_member(_user_id, o.workspace_id)
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.obra_restrictions r
        WHERE r.obra_id = _obra_id AND r.user_id = _user_id
      )
    );
$$;

-- RLS: workspaces
CREATE POLICY "Members can view workspaces"
  ON public.workspaces FOR SELECT TO authenticated
  USING (public.can_edit(auth.uid()) OR public.is_workspace_member(auth.uid(), id));

CREATE POLICY "Admins manage workspaces"
  ON public.workspaces FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: workspace_membros
CREATE POLICY "View memberships"
  ON public.workspace_membros FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.can_edit(auth.uid()));

CREATE POLICY "Admins manage memberships"
  ON public.workspace_membros FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: obras — SELECT agora é escopado por workspace
DROP POLICY IF EXISTS "Users can view obras" ON public.obras;
CREATE POLICY "Users can view obras"
  ON public.obras FOR SELECT TO authenticated
  USING (public.can_access_obra(auth.uid(), id));
