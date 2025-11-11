export interface UserConfig {
  id: string; // UUID
  updated_at: string; // ISO timestamp
  theme_id?: number | null;
  table_id?: number | null;
  ticket_update_notification?: boolean | null;
}