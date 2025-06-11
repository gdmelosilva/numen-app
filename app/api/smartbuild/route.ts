import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Helper to map DB row to frontend Contract type
interface ContractRow {
    id: string;
    projectExtId: number;
    projectName: string;
    projectDesc: string;
    projectHours: number | null;
    createdAt: string;
    updatedAt: string;
    endAt: string;
    partnerId: string;
    project_type: string;
    hours_max: number | null;
    cred_exp_period: number | null;
    value_hr_normal: number | null;
    value_hr_excdn: number | null;
    value_hr_except: number | null;
    value_hr_warn: number | null;
    baseline_hours: number | null;
    start_date: string | null;
    end_at: string | null;
    is_wildcard: boolean | null;
    opening_time: string | null;
    closing_time: string | null;
    is_247: boolean | null;    project_status: {
        name: string;
        color?: string;
    };
    partner?: {
        id: string;
        partner_desc?: string;
        partner_ext_id?: string;
        partner_city?: string;
        partner_email?: string;
        partner_tel?: string;
        partner_cep?: string;
        partner_state?: string;
        // ...adicione outros campos relevantes se necessário
    };
}

function mapContractRow(row: unknown) {
    const r = row as ContractRow;    return {
        id: r.id,
        projectExtId: r.projectExtId,
        projectName: r.projectName,
        projectDesc: r.projectDesc,
        projectHours: r.projectHours,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        endAt: r.endAt,
        partnerId: r.partnerId,
        project_type: r.project_type,
        hours_max: r.hours_max,
        cred_exp_period: r.cred_exp_period,
        value_hr_normal: r.value_hr_normal,
        value_hr_excdn: r.value_hr_excdn,
        value_hr_except: r.value_hr_except,
        value_hr_warn: r.value_hr_warn,
        baseline_hours: r.baseline_hours,
        start_date: r.start_date,
        end_at: r.end_at,
        is_wildcard: r.is_wildcard,
        opening_time: r.opening_time,
        closing_time: r.closing_time,
        is_247: r.is_247,
        project_status: r.project_status,
        partner: r.partner,
    };

}

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

    let query = supabase
        .from("project")
        .select(`*, partner:partnerId(*), project_status:project_status(*)`, { count: "exact" });    // Filtering
    if (searchParams.get("id")) {
        query = query.eq("id", searchParams.get("id"));
    }
    if (searchParams.get("projectExtId")) {
        query = query.eq("projectExtId", searchParams.get("projectExtId"));
    }
    if (searchParams.get("projectName")) {
        query = query.ilike("projectName", `%${searchParams.get("projectName")}%`);
    }
    if (searchParams.get("projectDesc")) {
        query = query.ilike("projectDesc", `%${searchParams.get("projectDesc")}%`);
    }
    if (searchParams.get("partnerId")) {
        query = query.eq("partnerId", searchParams.get("partnerId"));
    }
    if (searchParams.get("project_type")) {
        query = query.eq("project_type", searchParams.get("project_type"));
    }
    if (searchParams.get("project_status")) {
        query = query.eq("project_status", searchParams.get("project_status"));
    }
    if (searchParams.get("createdAt")) {
        query = query.gte("createdAt", searchParams.get("createdAt"));
    }
    if (searchParams.get("start_date")) {
        query = query.gte("start_date", searchParams.get("start_date"));
    }
    if (searchParams.get("end_at")) {
        query = query.gte("end_at", searchParams.get("end_at"));
    }
    if (searchParams.get("is_active")) {
        query = query.eq("is_active", searchParams.get("is_active") === "true");
    }
    if (searchParams.get("is_private")) {
        query = query.eq("is_private", searchParams.get("is_private") === "true");
    }
    if (searchParams.get("budget_min")) {
        query = query.gte("budget", parseFloat(searchParams.get("budget_min")!));
    }
    if (searchParams.get("budget_max")) {
        query = query.lte("budget", parseFloat(searchParams.get("budget_max")!));
    }

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to);

    // Sorting
    if (searchParams.get("sort_by")) {
        const sortBy = searchParams.get("sort_by")!;
        const sortOrder = searchParams.get("sort_order") === "desc" ? false : true;
        query = query.order(sortBy, { ascending: sortOrder });
    }

    const { data, error, count } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map DB rows to frontend shape
    const contracts = (data || []).map(mapContractRow);
    return NextResponse.json({ 
        data: contracts, 
        count,
        page,
        limit
    });
}