export interface Partner {
  id: string;
  partner_ext_id: string;
  partner_desc: string;
  partner_ident: string;
  partner_email: string;
  partner_tel: string;
  partner_segment: {
    name: string;
  };
  is_compadm: boolean;
  is_active: boolean;
}
