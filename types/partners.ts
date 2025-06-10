export interface Partner {
  id: string;
  partner_ext_id: string;
  partner_desc: string;
  partner_ident: string;
  partner_email: string;
  partner_tel: string;
  partner_segment: {
    id: string;
    name: string;
  };
  is_compadm: boolean;
  is_active: boolean;
  // Endereço
  partner_cep?: string;
  partner_addrs?: string;
  partner_compl?: string;
  partner_distr?: string;
  partner_city?: string;
  partner_state?: string;
  partner_cntry?: string;
}
