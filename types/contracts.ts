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
};