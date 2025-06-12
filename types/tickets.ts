export type TicketAttachment = {
  id: string;
  name: string;
  path: string;
};

export type Ticket = {
  id: string;
  external_id: string;
  title: string;
  description: string;
  hours: number | null;
  is_closed: boolean;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  planned_end_date: string | null;
  actual_end_date: string | null;
  category_id: number;
  type_id: number;
  module_id: number;
  status_id: number;
  priority_id: number;
  partner_id: string;
  project_id: string;
  created_by: string;
  // Optionally, you can add expanded fields for joins (category, type, etc.)
  category?: { id: number; name: string };
  type?: { id: number; name: string };
  module?: { id: number; name: string };
  status?: { id: number; name: string };
  priority?: { id: number; name: string };
  partner?: { id: string; partner_desc: string };
  project?: { id: string; projectName: string };
  created_by_user?: {
    last_name: string;
    first_name: string; id: string; name: string 
};
  attachments?: TicketAttachment[];
};
