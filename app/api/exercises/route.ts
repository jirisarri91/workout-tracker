import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET() {
  const db = createServerClient();
  const { data, error } = await db
    .from('exercises')
    .select('*')
    .order('name');
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(req: NextRequest) {
  const db = createServerClient();
  const body = await req.json();
  const { data, error } = await db
    .from('exercises')
    .insert({
      name: body.name,
      instructions: body.instructions ?? null,
      muscle_groups: body.muscle_groups ?? [],
      resources: body.resources ?? [],
    })
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}
