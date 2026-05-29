import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET() {
  const db = createServerClient();
  const { data, error } = await db
    .from('user_objectives')
    .select('*')
    .limit(1)
    .maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function PUT(req: NextRequest) {
  const db = createServerClient();
  const body = await req.json();

  const { data: existing } = await db.from('user_objectives').select('id').limit(1).maybeSingle();

  let result;
  if (existing) {
    result = await db
      .from('user_objectives')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
  } else {
    result = await db
      .from('user_objectives')
      .insert({ ...body })
      .select()
      .single();
  }

  if (result.error) return Response.json({ error: result.error.message }, { status: 500 });
  return Response.json(result.data);
}
