/**
 * API client for communicating with the Smart Task Planner backend.
 * Provides type-safe methods for all API endpoints.
 */

import axios, { AxiosInstance } from 'axios';

const API_URL = 'http://localhost:8000';

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

export interface CreatePlanRequest {
  goal: string;
  deadline?: string;
}

export interface TaskUpdate {
  name?: string;
  description?: string;
  optimistic_duration?: number;
  most_likely_duration?: number;
  pessimistic_duration?: number;
  dependencies?: number[];
  is_complete?: boolean;
}

export interface UpdatePlanRequest {
  tasks: TaskUpdate[];
}

export interface FeedbackRequest {
  feedback: string;
}

export interface NaturalLanguageUpdate {
  instruction: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 120000, // 2 minutes for LLM calls
    });
  }

  /**
   * Create a new plan from a goal
   */
  async createPlan(data: CreatePlanRequest): Promise<Plan> {
    const response = await this.client.post<Plan>('/api/plan', data);
    return response.data;
  }

  /**
   * Get all plans
   */
  async listPlans(): Promise<PlanSummary[]> {
    const response = await this.client.get<PlanSummary[]>('/api/plans');
    return response.data;
  }

  /**
   * Get a specific plan by ID
   */
  async getPlan(planId: number): Promise<Plan> {
    const response = await this.client.get<Plan>(`/api/plan/${planId}`);
    return response.data;
  }

  /**
   * Get insights and analytics for a plan
   */
  async getPlanInsights(planId: number): Promise<PlanInsights> {
    const response = await this.client.get<PlanInsights>(`/api/plan/${planId}/insights`);
    return response.data;
  }

  /**
   * Update a plan with modified tasks
   */
  async updatePlan(planId: number, data: UpdatePlanRequest): Promise<Plan> {
    const response = await this.client.put<Plan>(`/api/plan/${planId}/update`, data);
    return response.data;
  }

  /**
   * Refine a plan with user feedback
   */
  async refinePlanWithFeedback(planId: number, data: FeedbackRequest): Promise<Plan> {
    const response = await this.client.post<Plan>(`/api/plan/${planId}/feedback`, data);
    return response.data;
  }

  /**
   * Update plan with natural language instruction
   */
  async naturalLanguageUpdate(planId: number, data: NaturalLanguageUpdate): Promise<Plan> {
    const response = await this.client.post<Plan>(`/api/plan/${planId}/natural-update`, data);
    return response.data;
  }

  /**
   * Delete a plan
   */
  async deletePlan(planId: number): Promise<void> {
    await this.client.delete(`/api/plan/${planId}`);
  }

  /**
   * Check Google GenAI service health
   */
  async checkGenAIHealth(): Promise<any> {
    const response = await this.client.get('/api/health/genai');
    return response.data;
  }
}

export const apiClient = new ApiClient();
