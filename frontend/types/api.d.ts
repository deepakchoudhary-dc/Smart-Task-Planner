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

  export { Task, Plan };
}
