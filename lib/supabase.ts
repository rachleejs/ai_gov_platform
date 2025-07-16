import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`
    환경 변수가 설정되지 않았습니다.
    
    .env.local 파일에 다음을 추가하세요:
    NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
    
    현재 값:
    NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '설정됨' : '설정되지 않음'}
  `);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 데이터베이스 타입 정의
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          created_at: string
          updated_at: string
          is_guest: boolean
          avatar_url?: string
          role: 'admin' | 'expert' | 'user'
        }
        Insert: {
          id?: string
          email: string
          name: string
          created_at?: string
          updated_at?: string
          is_guest?: boolean
          avatar_url?: string
          role?: 'admin' | 'expert' | 'user'
        }
        Update: {
          id?: string
          email?: string
          name?: string
          created_at?: string
          updated_at?: string
          is_guest?: boolean
          avatar_url?: string
          role?: 'admin' | 'expert' | 'user'
        }
      }
      ai_models: {
        Row: {
          id: string
          name: string
          provider: string
          model_type: string
          description?: string
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          provider: string
          model_type: string
          description?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          provider?: string
          model_type?: string
          description?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      evaluations: {
        Row: {
          id: string
          user_id: string
          model_id: string
          evaluation_type: 'ethics' | 'psychology' | 'scenario' | 'expert'
          category: string
          score: number
          grade: string
          feedback?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          model_id: string
          evaluation_type: 'ethics' | 'psychology' | 'scenario' | 'expert'
          category: string
          score: number
          grade: string
          feedback?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          model_id?: string
          evaluation_type?: 'ethics' | 'psychology' | 'scenario' | 'expert'
          category?: string
          score?: number
          grade?: string
          feedback?: string
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          model_id: string
          auditor_id: string
          audit_type: string
          status: 'pending' | 'in_progress' | 'completed' | 'failed'
          risk_level: 'low' | 'medium' | 'high'
          findings?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          model_id: string
          auditor_id: string
          audit_type: string
          status?: 'pending' | 'in_progress' | 'completed' | 'failed'
          risk_level?: 'low' | 'medium' | 'high'
          findings?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          model_id?: string
          auditor_id?: string
          audit_type?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'failed'
          risk_level?: 'low' | 'medium' | 'high'
          findings?: string
          created_at?: string
          updated_at?: string
        }
      }
      performance_metrics: {
        Row: {
          id: string
          model_id: string
          benchmark_name: string
          score: number
          test_date: string
          created_at: string
        }
        Insert: {
          id?: string
          model_id: string
          benchmark_name: string
          score: number
          test_date: string
          created_at?: string
        }
        Update: {
          id?: string
          model_id?: string
          benchmark_name?: string
          score?: number
          test_date?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// 타입 헬퍼들
export type User = Database['public']['Tables']['users']['Row']
export type AIModel = Database['public']['Tables']['ai_models']['Row']
export type Evaluation = Database['public']['Tables']['evaluations']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']
export type PerformanceMetric = Database['public']['Tables']['performance_metrics']['Row'] 