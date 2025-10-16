declare module '@/lib/api' {
  export interface Task {
    id: number;
    plan_id: number;
    name: string;
    description?: string;
    optimistic_duration: number;
    most_likely_duration: number;
    pessimistic_duration: number;
    expected_duration: number;
    dependencies: number[];
    earliest_start: number;
    earliest_finish: number;
    latest_start: number;
    latest_finish: number;
    slack: number;
    start_date?: string;
    end_date?: string;
    is_complete: boolean;
    is_on_critical_path: boolean;
  }

  export interface Plan {
    id: number;
    goal: string;
    created_at: string;
    updated_at: string;
    total_duration: number;
    deadline?: string;
    critical_path: number[];
    tasks: Task[];
  }

  export interface PlanSummary {
    id: number;
    goal: string;
    created_at: string;
    total_duration: number;
    deadline?: string;
    task_count: number;
  }

  export interface RiskTask {
    id: number;
    name: string;
    slack: number;
    expected_duration: number;
    impact: string;
  }

  export interface PlanInsights {
    overall_risk: string;
    progress_percentage: number;
    average_slack: number;
    zero_slack_tasks: number;
    deadline_status: string;
    deadline_message: string;
    buffer_days?: number | null;
    critical_path: string[];
    high_risk_tasks: RiskTask[];
    recommendations: string[];
  }

  export interface CreatePlanRequest {
    goal: string;
    deadline?: string;
  }

  export interface UpdatePlanRequest {
    tasks: any[];
  }

  export interface FeedbackRequest {
    feedback: string;
  }

  export interface NaturalLanguageUpdate {
    instruction: string;
  }

  export const apiClient: {
    createPlan(data: CreatePlanRequest): Promise<Plan>;
    listPlans(): Promise<PlanSummary[]>;
    getPlan(planId: number): Promise<Plan>;
    getPlanInsights(planId: number): Promise<PlanInsights>;
    updatePlan(planId: number, data: UpdatePlanRequest): Promise<Plan>;
    refinePlanWithFeedback(planId: number, data: FeedbackRequest): Promise<Plan>;
    naturalLanguageUpdate(planId: number, data: NaturalLanguageUpdate): Promise<Plan>;
    deletePlan(planId: number): Promise<void>;
    checkGenAIHealth(): Promise<any>;
  };

  export { Task, Plan };
}
