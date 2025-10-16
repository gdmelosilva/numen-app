import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";

type FeedbackBody = {
    ticket_id?: string;
    fb_system?: number | null;
    fb_manager?: number | null;
    fb_functional?: number | null;
    fb_service?: number | null;
    comment?: string | null;
};

function validateFeedbackInput(body: FeedbackBody): string | null {
    if (!body?.ticket_id) return 'Invalid input: ticket_id obrigatório';
    const scores = [body.fb_system, body.fb_manager, body.fb_functional, body.fb_service];
    const invalid = scores.some((v) => v != null && (typeof v !== 'number' || v < 0 || v > 5));
    return invalid ? 'Invalid score: valores devem estar entre 0 e 5 quando fornecidos' : null;
}

function normalizeFeedback(body: FeedbackBody) {
    return {
        fb_system: typeof body.fb_system === 'number' && body.fb_system > 0 ? body.fb_system : null,
        fb_manager: typeof body.fb_manager === 'number' && body.fb_manager > 0 ? body.fb_manager : null,
        fb_functional: typeof body.fb_functional === 'number' && body.fb_functional > 0 ? body.fb_functional : null,
        fb_service: typeof body.fb_service === 'number' && body.fb_service > 0 ? body.fb_service : null,
        comment: typeof body.comment === 'string' && body.comment.trim().length > 0 ? body.comment.trim() : null,
    } as Required<Pick<FeedbackBody, 'fb_system' | 'fb_manager' | 'fb_functional' | 'fb_service' | 'comment'>>;
}

function hasAnyFieldFilled(n: ReturnType<typeof normalizeFeedback>): boolean {
    return n.fb_system !== null || n.fb_manager !== null || n.fb_functional !== null || n.fb_service !== null || n.comment !== null;
}

async function getExistingFeedbackId(supabase: unknown, ticket_id: string): Promise<string | null> {
    const client = supabase as {
        from: (table: string) => {
            select: (cols: string) => {
                eq: (col: string, val: string) => { maybeSingle: () => Promise<{ data: { id?: string } | null; error: { message: string } | null }> };
            };
        };
    };
    const { data, error } = await client
        .from('ticket_feedbacks')
        .select('id')
        .eq('ticket_id', ticket_id)
        .maybeSingle();
    if (error) throw new Error(error.message);
    return data?.id ?? null;
}


export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();

        // Verificar autenticação
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await req.json() as FeedbackBody;
        const inputErr = validateFeedbackInput(body);
        if (inputErr) return NextResponse.json({ error: inputErr }, { status: 400 });

        const { ticket_id } = body;
        const normalized = normalizeFeedback(body);
        if (!hasAnyFieldFilled(normalized)) {
            return NextResponse.json({ status: 'skipped' }, { status: 200 });
        }

        const existingId = await getExistingFeedbackId(supabase, ticket_id!);

        if (existingId) {
            const { data, error } = await supabase
                .from('ticket_feedbacks')
                .update({
                    fb_system: normalized.fb_system,
                    fb_manager: normalized.fb_manager,
                    fb_functional: normalized.fb_functional,
                    fb_service: normalized.fb_service,
                    comment: normalized.comment,
                })
                .eq('id', existingId)
                .select('id')
                .single();
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json({ id: data.id }, { status: 200 });
        }

        const { data, error } = await supabase
            .from('ticket_feedbacks')
            .insert([
                {
                    ticket_id,
                    fb_system: normalized.fb_system,
                    fb_manager: normalized.fb_manager,
                    fb_functional: normalized.fb_functional,
                    fb_service: normalized.fb_service,
                    comment: normalized.comment,
                    created_at: new Date().toISOString(),
                },
            ])
            .select('id')
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ id: data.id }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Server error' }, { status: 500 });
    }
}
