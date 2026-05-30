import { NextRequest } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, intent } = body as { date: string; intent: string };

  const [objective, exercises, recentSessions] = await Promise.all([
    prisma.userObjective.findFirst(),
    prisma.exercise.findMany({ select: { id: true, name: true, muscle_groups: true }, orderBy: { name: 'asc' } }),
    prisma.workoutSession.findMany({
      include: { exercises: { include: { exercise: { select: { name: true } } } } },
      orderBy: { date: 'desc' },
      take: 5,
    }),
  ]);

  const exerciseList = exercises.map(e => `- id:${e.id} | ${e.name} [${e.muscle_groups.join(', ')}]`).join('\n');

  const recentStr = recentSessions.map(s =>
    `${s.date.toISOString().split('T')[0]}: ${s.exercises.map(e => e.exercise.name).join(', ')}`
  ).join('\n');

  const prompt = `
Create a workout plan for ${date}.
${objective ? `User goal: ${objective.objective_text}\nStrategy: ${objective.strategy_text}` : ''}
Request: ${intent}

Recent workouts (avoid repeating same muscles on consecutive days):
${recentStr || 'None yet'}

Available exercises:
${exerciseList}

Respond ONLY with valid JSON, no markdown, in this exact format:
{
  "name": "workout name",
  "objective": "one-line goal for this session",
  "exercises": [
    {
      "exercise_id": "uuid here",
      "sets": 3,
      "reps": 10,
      "target_weight": 60,
      "rest_seconds": 90,
      "notes": "optional tip"
    }
  ]
}

Pick 4-7 exercises. Only use exercise_ids from the list above. target_weight can be null if bodyweight/unknown.
`.trim();

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: 'You are a fitness coach generating structured workout plans. Respond only with valid JSON.',
    messages: [{ role: 'user', content: prompt }],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';

  try {
    const parsed = JSON.parse(text.trim());
    return Response.json(parsed);
  } catch {
    return Response.json({ error: 'Failed to parse AI response', raw: text }, { status: 500 });
  }
}
