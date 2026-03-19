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
          company_id: string | null
          created_at: string
          id: string
          mensagem: string
          project_id: string | null
          resolvido: boolean
          tipo: Database["public"]["Enums"]["alert_type"]
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          mensagem: string
          project_id?: string | null
          resolvido?: boolean
          tipo: Database["public"]["Enums"]["alert_type"]
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          mensagem?: string
          project_id?: string | null
          resolvido?: boolean
          tipo?: Database["public"]["Enums"]["alert_type"]
        }
        Relationships: [
          {
            foreignKeyName: "alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "automations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          ativo: boolean
          company_id: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          status: Database["public"]["Enums"]["channel_status"]
          tipo: Database["public"]["Enums"]["channel_type"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          company_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          status?: Database["public"]["Enums"]["channel_status"]
          tipo?: Database["public"]["Enums"]["channel_type"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          company_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          status?: Database["public"]["Enums"]["channel_status"]
          tipo?: Database["public"]["Enums"]["channel_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "channels_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      client_systems: {
        Row: {
          company_id: string
          created_at: string
          id: string
          nome: string
          status: Database["public"]["Enums"]["client_system_status"]
          tipo: Database["public"]["Enums"]["client_system_type"]
          url: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          nome: string
          status?: Database["public"]["Enums"]["client_system_status"]
          tipo?: Database["public"]["Enums"]["client_system_type"]
          url?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          nome?: string
          status?: Database["public"]["Enums"]["client_system_status"]
          tipo?: Database["public"]["Enums"]["client_system_type"]
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_systems_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          area: string | null
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          plano?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          ativo: boolean | null
          created_at: string
          id: string
          logo_url: string | null
          nome: string
          plano: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          id?: string
          logo_url?: string | null
          nome: string
          plano?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          id?: string
          logo_url?: string | null
          nome?: string
          plano?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          autor_id: string | null
          company_id: string
          created_at: string
          descricao: string
          id: string
          lead_id: string
          tipo: string
        }
        Insert: {
          autor_id?: string | null
          company_id: string
          created_at?: string
          descricao: string
          id?: string
          lead_id: string
          tipo?: string
        }
        Update: {
          autor_id?: string | null
          company_id?: string
          created_at?: string
          descricao?: string
          id?: string
          lead_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          atendente_id: string | null
          atendente_tipo: Database["public"]["Enums"]["attendant_type"]
          channel_id: string | null
          company_id: string
          contato_nome: string
          contato_telefone: string | null
          created_at: string
          id: string
          instance_id: string | null
          lead_id: string | null
          mensagens_count: number
          status: Database["public"]["Enums"]["conversation_status"]
          ultima_mensagem: string | null
          ultima_mensagem_at: string | null
          updated_at: string
        }
        Insert: {
          atendente_id?: string | null
          atendente_tipo?: Database["public"]["Enums"]["attendant_type"]
          channel_id?: string | null
          company_id: string
          contato_nome: string
          contato_telefone?: string | null
          created_at?: string
          id?: string
          instance_id?: string | null
          lead_id?: string | null
          mensagens_count?: number
          status?: Database["public"]["Enums"]["conversation_status"]
          ultima_mensagem?: string | null
          ultima_mensagem_at?: string | null
          updated_at?: string
        }
        Update: {
          atendente_id?: string | null
          atendente_tipo?: Database["public"]["Enums"]["attendant_type"]
          channel_id?: string | null
          company_id?: string
          contato_nome?: string
          contato_telefone?: string | null
          created_at?: string
          id?: string
          instance_id?: string | null
          lead_id?: string | null
          mensagens_count?: number
          status?: Database["public"]["Enums"]["conversation_status"]
          ultima_mensagem?: string | null
          ultima_mensagem_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_atendente_id_fkey"
            columns: ["atendente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          autor_id: string | null
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
            foreignKeyName: "finances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          company_id: string
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          id: string
          status: Database["public"]["Enums"]["invoice_status"]
          valor: number
        }
        Insert: {
          company_id: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          valor: number
        }
        Update: {
          company_id?: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          cargo: string | null
          company_id: string
          created_at: string
          data_conversao: string | null
          email: string | null
          empresa: string | null
          id: string
          nome: string
          notas: string | null
          origem: Database["public"]["Enums"]["lead_origin"]
          responsavel_id: string | null
          status: Database["public"]["Enums"]["lead_status"]
          tags: string[] | null
          telefone: string | null
          updated_at: string
          valor_estimado: number | null
        }
        Insert: {
          cargo?: string | null
          company_id: string
          created_at?: string
          data_conversao?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          nome: string
          notas?: string | null
          origem?: Database["public"]["Enums"]["lead_origin"]
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[] | null
          telefone?: string | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Update: {
          cargo?: string | null
          company_id?: string
          created_at?: string
          data_conversao?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          nome?: string
          notas?: string | null
          origem?: Database["public"]["Enums"]["lead_origin"]
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[] | null
          telefone?: string | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["membership_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["membership_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["membership_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          company_id: string
          content: string
          conversation_id: string
          created_at: string
          direction: Database["public"]["Enums"]["message_direction"]
          id: string
          metadata: Json | null
          read: boolean
          sender_id: string | null
          sender_type: Database["public"]["Enums"]["attendant_type"] | null
        }
        Insert: {
          company_id: string
          content: string
          conversation_id: string
          created_at?: string
          direction: Database["public"]["Enums"]["message_direction"]
          id?: string
          metadata?: Json | null
          read?: boolean
          sender_id?: string | null
          sender_type?: Database["public"]["Enums"]["attendant_type"] | null
        }
        Update: {
          company_id?: string
          content?: string
          conversation_id?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["message_direction"]
          id?: string
          metadata?: Json | null
          read?: boolean
          sender_id?: string | null
          sender_type?: Database["public"]["Enums"]["attendant_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      project_tasks: {
        Row: {
          company_id: string | null
          created_at: string
          data_conclusao: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          ordem: number
          prioridade: Database["public"]["Enums"]["task_priority"]
          project_id: string
          responsavel_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          titulo: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          data_conclusao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          ordem?: number
          prioridade?: Database["public"]["Enums"]["task_priority"]
          project_id: string
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          titulo: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          data_conclusao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          ordem?: number
          prioridade?: Database["public"]["Enums"]["task_priority"]
          project_id?: string
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          area: string
          client_id: string | null
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      quote_requests: {
        Row: {
          company_id: string
          created_at: string
          email: string | null
          id: string
          mensagem: string | null
          nome_contato: string
          service_id: string | null
          status: Database["public"]["Enums"]["quote_status"]
          telefone: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          mensagem?: string | null
          nome_contato: string
          service_id?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          telefone?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          mensagem?: string | null
          nome_contato?: string
          service_id?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          ativo: boolean
          categoria: string | null
          company_id: string | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          preco_base: number | null
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          company_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          preco_base?: number | null
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          company_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          preco_base?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      whatsapp_instances: {
        Row: {
          api_token: string | null
          channel_id: string
          company_id: string
          created_at: string
          error_message: string | null
          id: string
          instance_name: string
          last_sync: string | null
          messages_received: number
          messages_sent: number
          metadata: Json | null
          phone_number: string | null
          qr_code: string | null
          status: Database["public"]["Enums"]["channel_status"]
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          api_token?: string | null
          channel_id: string
          company_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          instance_name: string
          last_sync?: string | null
          messages_received?: number
          messages_sent?: number
          metadata?: Json | null
          phone_number?: string | null
          qr_code?: string | null
          status?: Database["public"]["Enums"]["channel_status"]
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          api_token?: string | null
          channel_id?: string
          company_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          instance_name?: string
          last_sync?: string | null
          messages_received?: number
          messages_sent?: number
          metadata?: Json | null
          phone_number?: string | null
          qr_code?: string | null
          status?: Database["public"]["Enums"]["channel_status"]
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instances_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_instances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_company_ids: { Args: { _user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_belongs_to_company: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      user_has_company_role: {
        Args: {
          _company_id: string
          _role: Database["public"]["Enums"]["membership_role"]
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
      attendant_type: "ia" | "humano"
      automation_status: "ativa" | "inativa"
      campaign_status: "ativa" | "pausada" | "concluida"
      channel_status:
        | "connected"
        | "disconnected"
        | "connecting"
        | "error"
        | "pending"
      channel_type: "whatsapp" | "telegram" | "email" | "sms" | "webchat"
      client_system_status: "ativo" | "inativo" | "em_desenvolvimento"
      client_system_type:
        | "landing_page"
        | "sistema"
        | "automacao"
        | "chatbot"
        | "outro"
      conversation_status:
        | "aberta"
        | "em_atendimento"
        | "aguardando"
        | "resolvida"
        | "arquivada"
      document_type: "contrato" | "proposta" | "relatorio" | "outros"
      finance_type: "receita" | "despesa"
      invoice_status: "pendente" | "pago" | "vencido" | "cancelado"
      lead_origin:
        | "site"
        | "whatsapp"
        | "indicacao"
        | "campanha"
        | "organico"
        | "outro"
      lead_status:
        | "novo"
        | "contatado"
        | "qualificado"
        | "proposta"
        | "negociacao"
        | "ganho"
        | "perdido"
      membership_role: "owner" | "admin" | "manager" | "member" | "viewer"
      message_direction: "incoming" | "outgoing"
      project_status:
        | "planejamento"
        | "em_andamento"
        | "concluido"
        | "cancelado"
      quote_status: "pendente" | "em_analise" | "respondido" | "fechado"
      task_priority: "baixa" | "media" | "alta" | "urgente"
      task_status: "pendente" | "em_andamento" | "concluida" | "cancelada"
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
      attendant_type: ["ia", "humano"],
      automation_status: ["ativa", "inativa"],
      campaign_status: ["ativa", "pausada", "concluida"],
      channel_status: [
        "connected",
        "disconnected",
        "connecting",
        "error",
        "pending",
      ],
      channel_type: ["whatsapp", "telegram", "email", "sms", "webchat"],
      client_system_status: ["ativo", "inativo", "em_desenvolvimento"],
      client_system_type: [
        "landing_page",
        "sistema",
        "automacao",
        "chatbot",
        "outro",
      ],
      conversation_status: [
        "aberta",
        "em_atendimento",
        "aguardando",
        "resolvida",
        "arquivada",
      ],
      document_type: ["contrato", "proposta", "relatorio", "outros"],
      finance_type: ["receita", "despesa"],
      invoice_status: ["pendente", "pago", "vencido", "cancelado"],
      lead_origin: [
        "site",
        "whatsapp",
        "indicacao",
        "campanha",
        "organico",
        "outro",
      ],
      lead_status: [
        "novo",
        "contatado",
        "qualificado",
        "proposta",
        "negociacao",
        "ganho",
        "perdido",
      ],
      membership_role: ["owner", "admin", "manager", "member", "viewer"],
      message_direction: ["incoming", "outgoing"],
      project_status: [
        "planejamento",
        "em_andamento",
        "concluido",
        "cancelado",
      ],
      quote_status: ["pendente", "em_analise", "respondido", "fechado"],
      task_priority: ["baixa", "media", "alta", "urgente"],
      task_status: ["pendente", "em_andamento", "concluida", "cancelada"],
      user_status: ["pendente", "ativo", "inativo"],
    },
  },
} as const
