
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
      profiles: {
        Row: {
          id: string
          role: 'beneficiary' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: 'beneficiary' | 'admin'
        }
        Update: {
          role?: 'beneficiary' | 'admin'
        }
      }
      projects: {
        Row: {
          id: string
          nome: string
          descricao: string
          estado: string
          criado_em: string
        }
        Insert: {
          id?: string
          nome: string
          descricao: string
          estado: string
        }
        Update: {
          nome?: string
          descricao?: string
          estado?: string
        }
      }
      beneficiary_projects: {
        Row: {
          id: string
          beneficiary_id: string
          project_id: string
        }
        Insert: {
          id?: string
          beneficiary_id: string
          project_id: string
        }
        Update: {
          beneficiary_id?: string
          project_id?: string
        }
      }
      reports: {
        Row: {
          id: string
          project_id: string
          beneficiary_id: string
          period: 'mensal' | 'trimestral' | 'semestral' | 'anual'
          descricao_progresso: string
          postos_trabalho: number
          status: 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado'
          observacoes: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          project_id: string
          beneficiary_id: string
          period: 'mensal' | 'trimestral' | 'semestral' | 'anual'
          descricao_progresso: string
          postos_trabalho: number
          status?: 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado'
          observacoes?: string | null
        }
        Update: {
          period?: 'mensal' | 'trimestral' | 'semestral' | 'anual'
          descricao_progresso?: string
          postos_trabalho?: number
          status?: 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado'
          observacoes?: string | null
        }
      }
      attachments: {
        Row: {
          id: string
          report_id: string
          uploaded_by: string
          url: string
          type: 'foto_projeto' | 'comprovante'
          criado_em: string
        }
        Insert: {
          id?: string
          report_id: string
          uploaded_by: string
          url: string
          type: 'foto_projeto' | 'comprovante'
        }
        Update: {
          url?: string
          type?: 'foto_projeto' | 'comprovante'
        }
      }
      admin_comments: {
        Row: {
          id: string
          report_id: string
          admin_id: string
          comentario: string
          criado_em: string
        }
        Insert: {
          id?: string
          report_id: string
          admin_id: string
          comentario: string
        }
        Update: {
          comentario?: string
        }
      }
    }
    Enums: {
      user_role: 'beneficiary' | 'admin'
      report_period: 'mensal' | 'trimestral' | 'semestral' | 'anual'
      report_status: 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado'
      attachment_type: 'foto_projeto' | 'comprovante'
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type BeneficiaryProject = Database['public']['Tables']['beneficiary_projects']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
export type Attachment = Database['public']['Tables']['attachments']['Row']
export type AdminComment = Database['public']['Tables']['admin_comments']['Row']
