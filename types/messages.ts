export type Message = {
  id: string;
  ext_id: string;
  body: string;
  hours: number | null;
  is_private: boolean;
  created_at: string;
  created_by: string;
  ticket_id: string;
  status_id: number | null;
  user: { id: string; first_name?: string; last_name?: string };
  attachments?: { id: string; name: string; path: string }[];
  ref_msg_id?: string;
};
