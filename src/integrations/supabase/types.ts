export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_comments: {
        Row: {
          admin_id: string
          comentario: string
          criado_em: string
          id: string
          report_id: string
        }
        Insert: {
          admin_id: string
          comentario: string
          criado_em?: string
          id?: string
          report_id: string
        }
        Update: {
          admin_id?: string
          comentario?: string
          criado_em?: string
          id?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_comments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          criado_em: string
          id: string
          report_id: string
          type: Database["public"]["Enums"]["attachment_type"]
          uploaded_by: string
          url: string
        }
        Insert: {
          criado_em?: string
          id?: string
          report_id: string
          type: Database["public"]["Enums"]["attachment_type"]
          uploaded_by: string
          url: string
        }
        Update: {
          criado_em?: string
          id?: string
          report_id?: string
          type?: Database["public"]["Enums"]["attachment_type"]
          uploaded_by?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      beneficiary_projects: {
        Row: {
          atribuido_em: string
          beneficiary_id: string
          project_id: string
        }
        Insert: {
          atribuido_em?: string
          beneficiary_id: string
          project_id: string
        }
        Update: {
          atribuido_em?: string
          beneficiary_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beneficiary_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          criado_em: string
          descricao: string | null
          estado: string | null
          id: string
          nome: string
        }
        Insert: {
          criado_em?: string
          descricao?: string | null
          estado?: string | null
          id?: string
          nome: string
        }
        Update: {
          criado_em?: string
          descricao?: string | null
          estado?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          atualizado_em: string
          beneficiary_id: string
          criado_em: string
          descricao_progresso: string
          id: string
          observacoes: string | null
          period: Database["public"]["Enums"]["report_period"]
          postos_trabalho: number
          project_id: string
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          atualizado_em?: string
          beneficiary_id: string
          criado_em?: string
          descricao_progresso: string
          id?: string
          observacoes?: string | null
          period: Database["public"]["Enums"]["report_period"]
          postos_trabalho?: number
          project_id: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          atualizado_em?: string
          beneficiary_id?: string
          criado_em?: string
          descricao_progresso?: string
          id?: string
          observacoes?: string | null
          period?: Database["public"]["Enums"]["report_period"]
          postos_trabalho?: number
          project_id?: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      attachment_type: "foto_projeto" | "comprovante"
      report_period: "mensal" | "trimestral" | "semestral" | "anual"
      report_status: "rascunho" | "enviado" | "aprovado" | "rejeitado"
      user_role: "beneficiary" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attachment_type: ["foto_projeto", "comprovante"],
      report_period: ["mensal", "trimestral", "semestral", "anual"],
      report_status: ["rascunho", "enviado", "aprovado", "rejeitado"],
      user_role: ["beneficiary", "admin"],
    },
  },
} as const
