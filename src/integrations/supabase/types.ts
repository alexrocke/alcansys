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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          id: string
          mensagem: string
          project_id: string | null
          resolvido: boolean
          tipo: Database["public"]["Enums"]["alert_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          mensagem: string
          project_id?: string | null
          resolvido?: boolean
          tipo: Database["public"]["Enums"]["alert_type"]
        }
        Update: {
          created_at?: string
          id?: string
          mensagem?: string
          project_id?: string | null
          resolvido?: boolean
          tipo?: Database["public"]["Enums"]["alert_type"]
        }
        Relationships: [
          {
            foreignKeyName: "alerts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          created_at: string
          custo: number | null
          descricao: string | null
          id: string
          nome: string
          retorno: number | null
          status: Database["public"]["Enums"]["automation_status"]
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custo?: number | null
          descricao?: string | null
          id?: string
          nome: string
          retorno?: number | null
          status?: Database["public"]["Enums"]["automation_status"]
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custo?: number | null
          descricao?: string | null
          id?: string
          nome?: string
          retorno?: number | null
          status?: Database["public"]["Enums"]["automation_status"]
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          area: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          plano: string | null
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          area?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          plano?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          area?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          plano?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          autor_id: string | null
          created_at: string
          id: string
          nome: string
          project_id: string | null
          tags: string[] | null
          tipo: Database["public"]["Enums"]["document_type"]
          url: string
        }
        Insert: {
          autor_id?: string | null
          created_at?: string
          id?: string
          nome: string
          project_id?: string | null
          tags?: string[] | null
          tipo: Database["public"]["Enums"]["document_type"]
          url: string
        }
        Update: {
          autor_id?: string | null
          created_at?: string
          id?: string
          nome?: string
          project_id?: string | null
          tags?: string[] | null
          tipo?: Database["public"]["Enums"]["document_type"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      finances: {
        Row: {
          area: string | null
          created_at: string
          data: string
          descricao: string
          id: string
          project_id: string | null
          tipo: Database["public"]["Enums"]["finance_type"]
          updated_at: string
          valor: number
        }
        Insert: {
          area?: string | null
          created_at?: string
          data?: string
          descricao: string
          id?: string
          project_id?: string | null
          tipo: Database["public"]["Enums"]["finance_type"]
          updated_at?: string
          valor: number
        }
        Update: {
          area?: string | null
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          project_id?: string | null
          tipo?: Database["public"]["Enums"]["finance_type"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "finances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          nome: string
          orcamento: number | null
          roi: number | null
          status: Database["public"]["Enums"]["campaign_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          nome: string
          orcamento?: number | null
          roi?: number | null
          status?: Database["public"]["Enums"]["campaign_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          orcamento?: number | null
          roi?: number | null
          status?: Database["public"]["Enums"]["campaign_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          nome: string
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          area: string
          client_id: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          gestor_id: string | null
          id: string
          nome: string
          orcamento: number | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          area: string
          client_id?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          gestor_id?: string | null
          id?: string
          nome: string
          orcamento?: number | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          area?: string
          client_id?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          gestor_id?: string | null
          id?: string
          nome?: string
          orcamento?: number | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          chave: string
          id: string
          updated_at: string
          valor: Json
        }
        Insert: {
          chave: string
          id?: string
          updated_at?: string
          valor: Json
        }
        Update: {
          chave?: string
          id?: string
          updated_at?: string
          valor?: Json
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      alert_type:
        | "tarefa_atrasada"
        | "dominio_expirando"
        | "orcamento_excedido"
        | "receita_baixa"
        | "critico"
      app_role: "admin" | "gestor" | "colaborador" | "financeiro" | "marketing"
      automation_status: "ativa" | "inativa"
      campaign_status: "ativa" | "pausada" | "concluida"
      document_type: "contrato" | "proposta" | "relatorio" | "outros"
      finance_type: "receita" | "despesa"
      project_status:
        | "planejamento"
        | "em_andamento"
        | "concluido"
        | "cancelado"
      user_status: "pendente" | "ativo" | "inativo"
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
      alert_type: [
        "tarefa_atrasada",
        "dominio_expirando",
        "orcamento_excedido",
        "receita_baixa",
        "critico",
      ],
      app_role: ["admin", "gestor", "colaborador", "financeiro", "marketing"],
      automation_status: ["ativa", "inativa"],
      campaign_status: ["ativa", "pausada", "concluida"],
      document_type: ["contrato", "proposta", "relatorio", "outros"],
      finance_type: ["receita", "despesa"],
      project_status: [
        "planejamento",
        "em_andamento",
        "concluido",
        "cancelado",
      ],
      user_status: ["pendente", "ativo", "inativo"],
    },
  },
} as const
