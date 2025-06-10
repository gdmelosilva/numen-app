export type Contract = {
  id?: string | number;
  projectExtId: string;
  projectName: string;
  projectDesc: string;
  partnerId: string;
  partner_name: {
    partner_desc: string;
  };
  project_type: string;
  project_status: {
    name: string;
    color: string;
  };
  is_wildcard: boolean | null;
  is_247: boolean | null;
  start_date: string;
  end_at: string;
};