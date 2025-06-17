export type Contract = {
  id?: string | number;
  projectExtId?: string;
  projectName?: string;
  projectDesc?: string;
  partnerId?: string;
  partner?: {
    id: string;
    is_active: boolean;
    created_at: string;
    is_compadm: boolean;
    updated_at: string | null;
    partner_cep: string;
    partner_tel: string;
    partner_city: string;
    partner_desc: string;
    partner_addrs: string;
    partner_cntry: string;
    partner_compl: string;
    partner_distr: string;
    partner_email: string;
    partner_ident: string;
    partner_state: string;
    partner_ext_id: string;
    partner_mkt_sg: number;
  };
  project_type: string;
  project_status: {
    name: string;
    color: string;
  };
  is_wildcard: boolean | null;
  is_247: boolean | null;
  start_date?: string | null;
  end_at: string;
  // Campos de cobrança
  hours_max?: number | null;
  cred_exp_period?: number | null;
  value_hr_normal?: number | null;
  value_hr_excdn?: number | null;
  value_hr_except?: number | null;
  value_hr_warn?: number | null;
  baseline_hours?: number | null;
  opening_time?: string | null;
  closing_time?: string | null;
  partner_name?: {
    partner_desc: string;
  };
  project?: {
    id: string;
    endAt?: string | null;
    end_at?: string | null;
    is_247?: boolean;
    createdAt?: string;
    hours_max?: number | null;
    partnerId?: string;
    updatedAt?: string | null;
    start_date?: string | null;
    is_wildcard?: boolean;
    projectDesc?: string;
    projectName?: string;
    closing_time?: string | null;
    opening_time?: string | null;
    projectExtId?: string;
    projectHours?: number | null;
    project_type?: string;
    value_hr_warn?: number | null;
    baseline_hours?: number | null;
    project_status?: number;
    value_hr_excdn?: number | null;
    cred_exp_period?: number | null;
    value_hr_except?: number | null;
    value_hr_normal?: number | null;
  };
}