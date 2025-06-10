import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET() {
    try {
        const supabase = createClient();
        
        const { data, error } = await supabase
            .from('user')
            .select(`
                id,
                first_name,
                last_name,
                email,
                is_client,
                role
            `)
            .is('partner_id', null);

        if (error) {
            return NextResponse.json(
                { error: 'Error fetching users' },
                { status: 500 }
            );
        }

        const users = (data || []).map((user: {
            id: string;
            first_name: string;
            last_name: string;
            email: string;
            is_client: boolean;
            role: number | null;
        }) => ({
            ...user,
            is_verified: false,
            tel_contact: null,
            partner_id: null,
            partner_desc: null,
            created_at: '',
            is_active: true
        }));

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Error fetching partnerless users:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}