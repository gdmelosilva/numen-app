export interface User {
    id: string,
    first_name: string;
    last_name: string;
    email: string;
    is_verified: boolean;
    is_active: boolean;
    is_client: boolean;
    tel_contact: string | null;
    role: number | null;
    partner_id: number | null;
    partner_desc: string | null;
    hours_max?: number | null;
}

export interface UserWithModule extends User {
    user_functional_name?: string | null;
    ticket_module?: string | null;
}