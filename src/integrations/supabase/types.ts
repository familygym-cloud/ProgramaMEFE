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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alunos: {
        Row: {
          altura: number
          created_at: string
          email: string | null
          frequencia: number
          id: string
          idade: number
          imc: number
          matricula: string
          nome: string
          objetivo: string
          observacoes: string
          peso: number
          plano: string
          progresso: number
          status: string
          telefone: string | null
          termo_valido_ate: string | null
          turno: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          altura: number
          created_at?: string
          email?: string | null
          frequencia?: number
          id?: string
          idade: number
          imc: number
          matricula?: string
          nome: string
          objetivo?: string
          observacoes?: string
          peso: number
          plano: string
          progresso?: number
          status?: string
          telefone?: string | null
          termo_valido_ate?: string | null
          turno?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          altura?: number
          created_at?: string
          email?: string | null
          frequencia?: number
          id?: string
          idade?: number
          imc?: number
          matricula?: string
          nome?: string
          objetivo?: string
          observacoes?: string
          peso?: number
          plano?: string
          progresso?: number
          status?: string
          telefone?: string | null
          termo_valido_ate?: string | null
          turno?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      assinaturas_relatorio: {
        Row: {
          aluno_id: string
          assinado_em: string
          assinante: string
          created_at: string
          id: string
          referencia: string
        }
        Insert: {
          aluno_id: string
          assinado_em?: string
          assinante: string
          created_at?: string
          id?: string
          referencia?: string
        }
        Update: {
          aluno_id?: string
          assinado_em?: string
          assinante?: string
          created_at?: string
          id?: string
          referencia?: string
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_relatorio_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      aula_presencas: {
        Row: {
          aluno_id: string
          aula_id: string
          created_at: string
          id: string
        }
        Insert: {
          aluno_id: string
          aula_id: string
          created_at?: string
          id?: string
        }
        Update: {
          aluno_id?: string
          aula_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aula_presencas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aula_presencas_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      aulas: {
        Row: {
          created_at: string
          data: string
          horario: string
          id: string
          modalidade: string
          observacoes: string
          professor: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: string
          horario: string
          id?: string
          modalidade: string
          observacoes?: string
          professor?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          horario?: string
          id?: string
          modalidade?: string
          observacoes?: string
          professor?: string
          updated_at?: string
        }
        Relationships: []
      }
      avaliacoes: {
        Row: {
          aluno_id: string
          created_at: string
          id: string
          imc: number
          mes: string
          peso: number
          referencia: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          id?: string
          imc: number
          mes: string
          peso: number
          referencia: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          id?: string
          imc?: number
          mes?: string
          peso?: number
          referencia?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          aluno_id: string
          atividade: string
          created_at: string
          data: string
          duracao_min: number
          id: string
        }
        Insert: {
          aluno_id: string
          atividade: string
          created_at?: string
          data: string
          duracao_min: number
          id?: string
        }
        Update: {
          aluno_id?: string
          atividade?: string
          created_at?: string
          data?: string
          duracao_min?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          aluno_id: string
          created_at: string
          id: string
          metodo: string
          pago_em: string | null
          parcela: number
          referencia: string
          status: string
          total_parcelas: number
          valor: number
          vencimento: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          id?: string
          metodo?: string
          pago_em?: string | null
          parcela?: number
          referencia: string
          status?: string
          total_parcelas?: number
          valor: number
          vencimento: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          id?: string
          metodo?: string
          pago_em?: string | null
          parcela?: number
          referencia?: string
          status?: string
          total_parcelas?: number
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "staff" | "aluno"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["staff", "aluno"],
    },
  },
} as const
