import { NextRequest } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import { createServerClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const db = createServerClient();
  const body = await req.json();
  const customPrompt: string | undefined = body.prompt;

  const [objectivesRes, sessionsRes] = await Promise.all([
    db.from('user_objectives').select('*').limit(1).maybeSingle(),
    db.from('workout_sessions')
      .select(`
        *,
        exercises:workout_session_exercises(
          *,
          exercise:exercises(name, muscle_groups)
        )
      `)
      .order('date', { ascending: false })
      .limit(10),
  ]);

  const objectives = objectivesRes.data;
  const sessions = sessionsRes.data ?? [];

  const systemPrompt = `You are a personal fitness coach AI. Analyze the user's workout history and goals, then provide specific, actionable recommendations. Be encouraging and practical. Format your response with clear sections using markdown.`;

  const userMessage = `
${objectives ? `**My fitness goal:** ${objectives.objective_text ?? 'Not set'}
**My training strategy:** ${objectives.strategy_text ?? 'Not set'}` : 'No fitness goals set yet.'}

**Recent workout sessions (last ${sessions.length}):**
${sessions.map(s => `
- ${s.date}: ${s.status.toUpperCase()}${s.actual_start_time && s.actual_end_time ? ` (${Math.round((new Date(s.actual_end_time).getTime() - new Date(s.actual_start_time).getTime()) / 60000)} min)` : ''}
  Exercises: ${s.exercises?.map((e: { exercise?: { name: string }; actual_weight?: number; reps?: number; sets?: number; status: string }) =>
    `${e.exercise?.name ?? 'Unknown'} ${e.actual_weight ? `@ ${e.actual_weight}kg` : ''} ${e.sets && e.reps ? `${e.sets}×${e.reps}` : ''} [${e.status}]`
  ).join(', ') ?? 'None'}
`).join('')}

${customPrompt ? `**My specific question:** ${customPrompt}` : '**Please provide:** progressive overload suggestions, recovery assessment, and any adjustments to my weekly training plan.'}
  `.trim();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        });

        for await (const chunk of response) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'AI error';
        controller.enqueue(encoder.encode(`\n\n**Error:** ${msg}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
