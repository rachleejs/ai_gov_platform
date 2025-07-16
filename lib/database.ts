import { supabase } from './supabase';
import type { User, AIModel, Evaluation, AuditLog, PerformanceMetric } from './supabase';

// 사용자 관련 함수들
export const userService = {
  async getProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    return data;
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
    return true;
  }
};

// AI 모델 관련 함수들
export const modelService = {
  async getAllModels(): Promise<AIModel[]> {
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching AI models:', error);
      return [];
    }
    return data || [];
  },

  async getModelById(modelId: string): Promise<AIModel | null> {
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('id', modelId)
      .single();

    if (error) {
      console.error('Error fetching AI model:', error);
      return null;
    }
    return data;
  }
};

// 평가 관련 함수들
export const evaluationService = {
  async saveEvaluation(evaluation: Omit<Evaluation, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    const { error } = await supabase
      .from('evaluations')
      .insert([evaluation]);

    if (error) {
      console.error('Error saving evaluation:', error);
      return false;
    }
    return true;
  },

  async getUserEvaluations(userId: string): Promise<Evaluation[]> {
    const { data, error } = await supabase
      .from('evaluations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user evaluations:', error);
      return [];
    }
    return data || [];
  },

  async getModelEvaluations(modelId: string): Promise<Evaluation[]> {
    const { data, error } = await supabase
      .from('evaluations')
      .select('*')
      .eq('model_id', modelId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching model evaluations:', error);
      return [];
    }
    return data || [];
  },

  async getEvaluationsByType(evaluationType: 'ethics' | 'psychology' | 'scenario' | 'expert'): Promise<Evaluation[]> {
    const { data, error } = await supabase
      .from('evaluations')
      .select('*')
      .eq('evaluation_type', evaluationType)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching evaluations by type:', error);
      return [];
    }
    return data || [];
  }
};

// 감사 로그 관련 함수들
export const auditService = {
  async createAuditLog(audit: Omit<AuditLog, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    const { error } = await supabase
      .from('audit_logs')
      .insert([audit]);

    if (error) {
      console.error('Error creating audit log:', error);
      return false;
    }
    return true;
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
    return data || [];
  },

  async updateAuditStatus(auditId: string, status: 'pending' | 'in_progress' | 'completed' | 'failed'): Promise<boolean> {
    const { error } = await supabase
      .from('audit_logs')
      .update({ status })
      .eq('id', auditId);

    if (error) {
      console.error('Error updating audit status:', error);
      return false;
    }
    return true;
  }
};

// 성능 메트릭 관련 함수들
export const performanceService = {
  async savePerformanceMetric(metric: Omit<PerformanceMetric, 'id' | 'created_at'>): Promise<boolean> {
    const { error } = await supabase
      .from('performance_metrics')
      .insert([metric]);

    if (error) {
      console.error('Error saving performance metric:', error);
      return false;
    }
    return true;
  },

  async getModelPerformance(modelId: string): Promise<PerformanceMetric[]> {
    const { data, error } = await supabase
      .from('performance_metrics')
      .select('*')
      .eq('model_id', modelId)
      .order('test_date', { ascending: false });

    if (error) {
      console.error('Error fetching model performance:', error);
      return [];
    }
    return data || [];
  },

  async getBenchmarkResults(benchmarkName: string): Promise<PerformanceMetric[]> {
    const { data, error } = await supabase
      .from('performance_metrics')
      .select('*')
      .eq('benchmark_name', benchmarkName)
      .order('test_date', { ascending: false });

    if (error) {
      console.error('Error fetching benchmark results:', error);
      return [];
    }
    return data || [];
  }
};

// 대시보드 통계 관련 함수들
export const dashboardService = {
  async getOverallStats() {
    try {
      const [models, evaluations, audits] = await Promise.all([
        modelService.getAllModels(),
        evaluationService.getUserEvaluations(''), // 전체 평가 조회를 위해 빈 문자열 사용
        auditService.getAuditLogs()
      ]);

      const activeModels = models.filter(m => m.is_active).length;
      const completedAudits = audits.filter(a => a.status === 'completed').length;
      const highRiskAlerts = audits.filter(a => a.risk_level === 'high').length;
      const recentEvaluations = evaluations.filter(e => {
        const evalDate = new Date(e.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return evalDate > weekAgo;
      }).length;

      return {
        activeModels,
        completedAudits,
        highRiskAlerts,
        recentEvaluations,
        totalEvaluations: evaluations.length
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        activeModels: 0,
        completedAudits: 0,
        highRiskAlerts: 0,
        recentEvaluations: 0,
        totalEvaluations: 0
      };
    }
  }
}; 