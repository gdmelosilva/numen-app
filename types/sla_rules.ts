export interface SlaRule {
  id: number;
  created_at: string;
  project_id: string;
  ticket_category_id?: number | null;
  priority_id?: number | null;
  status_id?: number | null;
  weekday_id?: number | null;
  sla_hours?: number | null;
  updated_at?: string | null;
  warning: boolean;
}

export interface CreateSlaRuleRequest {
  project_id: string;
  ticket_category_id?: number | null;
  priority_id?: number | null;
  status_id?: number | null;
  weekday_id?: number | null;
  sla_hours?: number | null;
  warning?: boolean;
}

export interface UpdateSlaRuleRequest {
  ticket_category_id?: number | null;
  priority_id?: number | null;
  status_id?: number | null;
  weekday_id?: number | null;
  sla_hours?: number | null;
  warning?: boolean;
  updated_at?: string; // Adicionar este campo
}