// Minimal valid Next.js route module
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'OK' });
}
