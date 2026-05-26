export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      access_log: {
        Row: {
          accessed_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          accessed_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          accessed_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      arquivo_chunks: {
        Row: {
          arquivo_id: string
          chunk_index: number
          content: string
          content_tsv: unknown
          created_at: string
          embedding: string | null
          id: string
          metadata: Json
          page_number: number | null
          source: string
        }
        Insert: {
          arquivo_id: string
          chunk_index: number
          content: string
          content_tsv?: unknown
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          page_number?: number | null
          source: string
        }
        Update: {
          arquivo_id?: string
          chunk_index?: number
          content?: string
          content_tsv?: unknown
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          page_number?: number | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "arquivo_chunks_arquivo_id_fkey"
            columns: ["arquivo_id"]
            isOneToOne: false
            referencedRelation: "arquivos"
            referencedColumns: ["id"]
          },
        ]
      }
      arquivos: {
        Row: {
          arquivo_url: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          descricao: string | null
          id: string
          indexacao_erro: string | null
          indexado_em: string | null
          nome: string
          obra_id: string
          paginas_total: number | null
          pasta_id: string | null
          status_indexacao: Database["public"]["Enums"]["status_indexacao"]
          tamanho: number | null
          tipo: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          arquivo_url: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          id?: string
          indexacao_erro?: string | null
          indexado_em?: string | null
          nome: string
          obra_id: string
          paginas_total?: number | null
          pasta_id?: string | null
          status_indexacao?: Database["public"]["Enums"]["status_indexacao"]
          tamanho?: number | null
          tipo?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          arquivo_url?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          id?: string
          indexacao_erro?: string | null
          indexado_em?: string | null
          nome?: string
          obra_id?: string
          paginas_total?: number | null
          pasta_id?: string | null
          status_indexacao?: Database["public"]["Enums"]["status_indexacao"]
          tamanho?: number | null
          tipo?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arquivos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arquivos_pasta_id_fkey"
            columns: ["pasta_id"]
            isOneToOne: false
            referencedRelation: "pastas"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_users: {
        Row: {
          blocked_at: string
          blocked_by: string | null
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          blocked_at?: string
          blocked_by?: string | null
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          blocked_at?: string
          blocked_by?: string | null
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_conversas: {
        Row: {
          created_at: string
          id: string
          obra_id: string | null
          titulo: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          obra_id?: string | null
          titulo?: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          obra_id?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_mensagens: {
        Row: {
          citacoes: Json | null
          completion_tokens: number | null
          content: string
          conversa_id: string
          cost_usd: number | null
          created_at: string
          id: string
          model: string | null
          prompt_tokens: number | null
          role: string
          tool_calls: Json | null
          total_tokens: number | null
        }
        Insert: {
          citacoes?: Json | null
          completion_tokens?: number | null
          content?: string
          conversa_id: string
          cost_usd?: number | null
          created_at?: string
          id?: string
          model?: string | null
          prompt_tokens?: number | null
          role: string
          tool_calls?: Json | null
          total_tokens?: number | null
        }
        Update: {
          citacoes?: Json | null
          completion_tokens?: number | null
          content?: string
          conversa_id?: string
          cost_usd?: number | null
          created_at?: string
          id?: string
          model?: string | null
          prompt_tokens?: number | null
          role?: string
          tool_calls?: Json | null
          total_tokens?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_mensagens_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "chat_conversas"
            referencedColumns: ["id"]
          },
        ]
      }
      favoritos: {
        Row: {
          arquivo_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          arquivo_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          arquivo_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_arquivo_id_fkey"
            columns: ["arquivo_id"]
            isOneToOne: false
            referencedRelation: "arquivos"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          status: string
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          status?: string
          token?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          status?: string
          token?: string
        }
        Relationships: []
      }
      obra_permissoes: {
        Row: {
          acoes: Database["public"]["Enums"]["pasta_acao"][]
          created_at: string
          id: string
          obra_id: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          acoes?: Database["public"]["Enums"]["pasta_acao"][]
          created_at?: string
          id?: string
          obra_id: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          acoes?: Database["public"]["Enums"]["pasta_acao"][]
          created_at?: string
          id?: string
          obra_id?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obra_permissoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      obra_restrictions: {
        Row: {
          created_at: string
          id: string
          obra_id: string
          restricted_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          obra_id: string
          restricted_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          obra_id?: string
          restricted_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obra_restrictions_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      obras: {
        Row: {
          created_at: string
          descricao: string | null
          endereco: string | null
          foto_url: string | null
          id: string
          nome: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          endereco?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          endereco?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obras_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pasta_compartilhamentos: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string | null
          id: string
          pasta_id: string
          permite_download: boolean
          short_code: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          pasta_id: string
          permite_download?: boolean
          short_code: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          pasta_id?: string
          permite_download?: boolean
          short_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pasta_compartilhamentos_pasta_id_fkey"
            columns: ["pasta_id"]
            isOneToOne: true
            referencedRelation: "pastas"
            referencedColumns: ["id"]
          },
        ]
      }
      pasta_permissoes: {
        Row: {
          acoes: Database["public"]["Enums"]["pasta_acao"][]
          created_at: string
          id: string
          pasta_id: string
          updated_at: string
          updated_by: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          acoes?: Database["public"]["Enums"]["pasta_acao"][]
          created_at?: string
          id?: string
          pasta_id: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          acoes?: Database["public"]["Enums"]["pasta_acao"][]
          created_at?: string
          id?: string
          pasta_id?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pasta_permissoes_pasta_id_fkey"
            columns: ["pasta_id"]
            isOneToOne: false
            referencedRelation: "pastas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pasta_permissoes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pasta_workspace_vinculos: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          obra_destino_id: string
          pasta_id: string
          workspace_destino_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          obra_destino_id: string
          pasta_id: string
          workspace_destino_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          obra_destino_id?: string
          pasta_id?: string
          workspace_destino_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pasta_workspace_vinculos_obra_destino_id_fkey"
            columns: ["obra_destino_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pasta_workspace_vinculos_pasta_id_fkey"
            columns: ["pasta_id"]
            isOneToOne: false
            referencedRelation: "pastas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pasta_workspace_vinculos_workspace_destino_id_fkey"
            columns: ["workspace_destino_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pastas: {
        Row: {
          cor: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          nome: string
          obra_id: string
          pasta_pai_id: string | null
          updated_at: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          nome: string
          obra_id: string
          pasta_pai_id?: string | null
          updated_at?: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          nome?: string
          obra_id?: string
          pasta_pai_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pastas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pastas_pasta_pai_id_fkey"
            columns: ["pasta_pai_id"]
            isOneToOne: false
            referencedRelation: "pastas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          created_at: string
          id: string
          nome: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          id?: string
          nome?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          id?: string
          nome?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workspace_membros: {
        Row: {
          created_at: string
          id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_membros_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          cor: string | null
          created_at: string
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      chat_usage_por_usuario: {
        Row: {
          completion_tokens: number | null
          cost_usd: number | null
          dia: string | null
          perguntas: number | null
          prompt_tokens: number | null
          total_tokens: number | null
          ultima_mensagem: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_access_by_day: {
        Args: { _days?: number }
        Returns: {
          dia: string
          total: number
        }[]
      }
      admin_folders_top: {
        Args: { _limit?: number }
        Returns: {
          obra_nome: string
          pasta_id: string
          pasta_nome: string
          total: number
        }[]
      }
      admin_heaviest_files: {
        Args: { _limit?: number }
        Returns: {
          arquivo_id: string
          nome: string
          obra_nome: string
          pasta_nome: string
          tamanho: number
        }[]
      }
      admin_uploads_by_month: {
        Args: { _months?: number }
        Returns: {
          mes: string
          total: number
        }[]
      }
      admin_uploads_by_week: {
        Args: { _weeks?: number }
        Returns: {
          semana: string
          total: number
        }[]
      }
      admin_uploads_list: {
        Args: {
          _from: string
          _limit?: number
          _tipo_prefix?: string
          _to: string
          _uploaded_by?: string
          _workspace_id?: string
        }
        Returns: {
          arquivo_id: string
          created_at: string
          nome: string
          obra_id: string
          obra_nome: string
          pasta_id: string
          pasta_nome: string
          tamanho: number
          tipo: string
          uploaded_by: string
          uploader_nome: string
          workspace_id: string
          workspace_nome: string
        }[]
      }
      buscar_arquivo_por_nome: {
        Args: {
          match_count?: number
          p_obra_id?: string
          p_workspace_id?: string
          termo: string
        }
        Returns: {
          arquivo_id: string
          nome: string
          obra_id: string
          obra_nome: string
          pasta_id: string
          pasta_nome: string
          score: number
          status_indexacao: Database["public"]["Enums"]["status_indexacao"]
          tipo: string
        }[]
      }
      buscar_conteudo_chunks: {
        Args: {
          match_count?: number
          p_obra_id?: string
          p_workspace_id?: string
          query_embedding: string
          query_text: string
        }
        Returns: {
          arquivo_id: string
          arquivo_nome: string
          chunk_id: string
          content: string
          page_number: number
          score: number
        }[]
      }
      can_access_obra: {
        Args: { _obra_id: string; _user_id: string }
        Returns: boolean
      }
      can_edit: { Args: { _user_id: string }; Returns: boolean }
      chat_usage_admin: {
        Args: { p_dias?: number }
        Returns: {
          completion_tokens: number
          cost_usd: number
          perguntas: number
          prompt_tokens: number
          total_tokens: number
          user_id: string
        }[]
      }
      chat_usage_admin_totais: {
        Args: { p_dias?: number }
        Returns: {
          total_completion_tokens: number
          total_cost_usd: number
          total_perguntas: number
          total_prompt_tokens: number
          total_tokens: number
          usuarios_ativos: number
        }[]
      }
      cleanup_deleted_arquivos: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_user_blocked: { Args: { _user_id: string }; Returns: boolean }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      log_access: { Args: never; Returns: undefined }
      obra_acoes_efetivas: {
        Args: { _obra_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["pasta_acao"][]
      }
      pasta_acoes_efetivas: {
        Args: { _pasta_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["pasta_acao"][]
      }
      pasta_acoes_efetivas_ws: {
        Args: { _pasta_id: string; _user_id: string; _workspace_id: string }
        Returns: Database["public"]["Enums"]["pasta_acao"][]
      }
      pasta_share_descendentes: {
        Args: { _root_pasta_id: string }
        Returns: {
          id: string
        }[]
      }
      pasta_tem_acao: {
        Args: {
          _acao: Database["public"]["Enums"]["pasta_acao"]
          _pasta_id: string
          _user_id: string
        }
        Returns: boolean
      }
      pasta_workspaces: { Args: { _pasta_id: string }; Returns: string[] }
      pastas_raiz_da_obra: {
        Args: { _obra_id: string }
        Returns: {
          cor: string
          created_at: string
          deleted_at: string
          id: string
          is_vinculo: boolean
          nome: string
          obra_id: string
          origem_workspace_id: string
          pasta_pai_id: string
          updated_at: string
        }[]
      }
      pode_gerenciar_obra: {
        Args: { _obra_id: string; _user_id: string }
        Returns: boolean
      }
      pode_gerenciar_pasta: {
        Args: { _pasta_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "editor" | "viewer"
      pasta_acao: "ver" | "baixar" | "link" | "add" | "editar" | "excluir"
      status_indexacao:
        | "pendente"
        | "processando"
        | "indexado"
        | "falhou"
        | "nao_aplicavel"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "editor", "viewer"],
      pasta_acao: ["ver", "baixar", "link", "add", "editar", "excluir"],
      status_indexacao: [
        "pendente",
        "processando",
        "indexado",
        "falhou",
        "nao_aplicavel",
      ],
    },
  },
} as const
