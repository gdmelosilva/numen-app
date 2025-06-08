// pages/api/create-user.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize the Supabase client with the admin-level service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { 
      email, 
      firstName, 
      lastName, 
      telephone,
      isClient,
      role,
      partnerId 
    } = await request.json();

    console.log('Creating user with data:', {
      email,
      firstName,
      lastName,
      telephone,
      isClient: Boolean(isClient),
      role,
      partnerId
    });

    // Validate required fields (role is now optional)
    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields: email, firstName, and lastName are required.' },
        { status: 400 }
      );
    }

    // Use inviteUserByEmail with proper data structure
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
        data: {
          first_name: firstName,
          last_name: lastName,
          is_client: Boolean(isClient),
          tel_contact: telephone || null,
          role: role,
          partner_id: partnerId && partnerId.trim() !== '' ? partnerId : null
        }
      }
    );

    if (error) {
      console.error('Supabase auth error:', {
        message: error.message,
        status: error.status,
        code: error.code
      });
      throw error;
    }

    return NextResponse.json({ success: true, user: data.user });

  } catch (err) {
    const error = err as Error & { status?: number; code?: string };
    console.error('Full error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      stack: error.stack
    });

    // Handle specific database errors
    let friendlyMessage = 'An unexpected error occurred.';
    let status = 500;

    if (error.message?.includes('Database error saving new user')) {
      friendlyMessage = 'Database error occurred while creating user. Please check the user data and try again.';
      status = 500;
    } else if (error.message?.includes('duplicate key') || error.message?.includes('already exists')) {
      friendlyMessage = 'A user with this email already exists.';
      status = 409;
    } else if (error.message?.includes('Foreign Key Violation')) {
      friendlyMessage = 'Invalid role or partner ID provided.';
      status = 400;
    } else if (error.message?.includes('Invalid UUID Format')) {
      friendlyMessage = 'Invalid partner ID format.';
      status = 400;
    }

    return NextResponse.json({ 
      error: friendlyMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status });
  }
}