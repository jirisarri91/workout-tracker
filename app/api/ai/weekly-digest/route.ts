import { prisma } from '@/lib/prisma';
import { anthropic } from '@/lib/anthropic';
import { serialize } from '@/lib/serialize';
import { startOfWeek, subWeeks, format } from 'date-fns';

export async function GET() {
  const thisMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStart = format(thisMonday, 'yyyy-MM-dd');

  const existing = await prisma.aIDigest.findUnique({ where: { week_start: new Date(weekStart) } });
  if (existing) return Response.json(serialize(existing));

  const lastWeekStart = subWeeks(thisMonday, 1);
  const [objective, sessions, latestWeight] = await Promise.all([
    prisma.userObjective.findFirst(),
    prisma.workoutSession.findMany({
      where: { date: { gte: lastWeekStart } },
      include: {
        exercises: {
          include: { exercise: { select: { name: true, muscle_groups: true } } },
        },
      },
      orderBy: { date: 'asc' },
    }),
    prisma.weightEntry.findFirst({ orderBy: { date: 'desc' } }),
  ]);

  const allSessions = await prisma.workoutSession.findMany({
    where: { date: { gte: subWeeks(thisMonday, 8) } },
    include: {
      exercises: { include: { exercise: { select: { muscle_groups: true } } } },
    },
    orderBy: { date: 'asc' },
  });

  const age = objective?.birthday
    ? Math.floor((Date.now() - new Date(objective.birthday).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  const serialized = serialize(sessions) as Array<{
    date: string; status: string;
    exercises?: Array<{ exercise?: { name: string }; actual_weight?: number; sets?: number; reps?: number; status: string }>;
  }>;

  const weeklyVolumes = computeWeeklyVolumes(serialize(allSessions) as Array<{ date: string; exercises?: Array<{ exercise?: { muscle_groups?: string[] }; actual_weight?: number; sets?: number; reps?: number }> }>);

  const prompt = `
${objective ? `Goal: ${objective.objective_text ?? 'Not set'}\nStrategy: ${objective.strategy_text ?? 'Not set'}` : 'No goals set.'}
${age ? `Age: ${age}` : ''}
${latestWeight ? `Current weight: ${Number(latestWeight.weight_kg)}kg` : ''}

Last week's sessions (${serialized.length}):
${serialized.map(s => `- ${s.date}: ${s.status} | ${s.exercises?.map(e => `${e.exercise?.name ?? '?'} ${e.actual_weight ? `@ ${e.actual_weight}kg` : ''} ${e.sets && e.reps ? `${e.sets}×${e.reps}` : ''}`).join(', ') ?? 'none'}`).join('\n')}

8-week weekly volumes (sets×reps×kg per muscle group):
${weeklyVolumes}

Write a concise weekly training recap in markdown with these exact sections:
## Last week
2-3 bullet points on what happened.
## Trend
1-2 sentences on volume/consistency trend. If 4+ consecutive weeks of high load, recommend a deload.
## This week
3 specific actionable bullet points (progressive overload, focus areas, recovery).
`.trim();

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    system: 'You are a concise personal fitness coach. Be specific and data-driven. Use markdown.',
    messages: [{ role: 'user', content: prompt }],
  });

  const content = msg.content[0].type === 'text' ? msg.content[0].text : '';

  const digest = await prisma.aIDigest.create({
    data: { week_start: new Date(weekStart), content },
  });

  return Response.json(serialize(digest));
}

export async function DELETE() {
  const thisMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStart = format(thisMonday, 'yyyy-MM-dd');
  await prisma.aIDigest.deleteMany({ where: { week_start: new Date(weekStart) } });
  return new Response(null, { status: 204 });
}

function computeWeeklyVolumes(sessions: Array<{ date: string; exercises?: Array<{ exercise?: { muscle_groups?: string[] }; actual_weight?: number; sets?: number; reps?: number }> }>): string {
  const weekMap: Record<string, Record<string, number>> = {};
  for (const s of sessions) {
    const week = format(startOfWeek(new Date(s.date), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    if (!weekMap[week]) weekMap[week] = {};
    for (const e of s.exercises ?? []) {
      const groups = e.exercise?.muscle_groups ?? ['other'];
      const vol = (e.actual_weight ?? 0) * (e.sets ?? 1) * (e.reps ?? 1);
      for (const g of groups) {
        weekMap[week][g] = (weekMap[week][g] ?? 0) + vol;
      }
    }
  }
  return Object.entries(weekMap)
    .map(([week, groups]) => `${week}: ${Object.entries(groups).map(([g, v]) => `${g}=${Math.round(v)}`).join(', ')}`)
    .join('\n');
}
