import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { anthropic } from '@/lib/anthropic';
import { prisma } from '@/lib/prisma';
import { serialize } from '@/lib/serialize';

type ToolInput = Record<string, unknown>;

const tools: Anthropic.Tool[] = [
  {
    name: 'list_exercises',
    description:
      'List all available exercises with their IDs, names, and muscle groups. Always call this before creating templates or workout plans to get valid exercise IDs.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'create_template',
    description: 'Create a reusable workout template with a list of exercises.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Template name' },
        objective: { type: 'string', description: 'Goal or objective of this template' },
        notes: { type: 'string', description: 'Additional notes' },
        exercises: {
          type: 'array',
          description: 'Exercises to include',
          items: {
            type: 'object',
            properties: {
              exercise_id: { type: 'string', description: 'ID from list_exercises' },
              block_name: { type: 'string', description: 'e.g. "Warm-up", "Main", "Finisher"' },
              sets: { type: 'number' },
              reps: { type: 'number' },
              target_weight: { type: 'number', description: 'kg' },
              rest_seconds: { type: 'number' },
              notes: { type: 'string' },
            },
            required: ['exercise_id'],
          },
        },
      },
      required: ['name', 'exercises'],
    },
  },
  {
    name: 'create_workout_plan',
    description: 'Create a workout plan for today or a future date. Past dates are not allowed.',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'YYYY-MM-DD' },
        name: { type: 'string' },
        objective: { type: 'string' },
        notes: { type: 'string' },
        exercises: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              exercise_id: { type: 'string', description: 'ID from list_exercises' },
              block_name: { type: 'string' },
              sets: { type: 'number' },
              reps: { type: 'number' },
              target_weight: { type: 'number', description: 'kg' },
              rest_seconds: { type: 'number' },
              notes: { type: 'string' },
            },
            required: ['exercise_id'],
          },
        },
      },
      required: ['date', 'exercises'],
    },
  },
  {
    name: 'create_mesocycle',
    description: 'Create a training mesocycle — a structured training phase with a goal and date range.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        start_date: { type: 'string', description: 'YYYY-MM-DD' },
        end_date: { type: 'string', description: 'YYYY-MM-DD' },
        goal: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['name', 'start_date', 'end_date'],
    },
  },
];

async function executeTool(name: string, input: ToolInput): Promise<unknown> {
  if (name === 'list_exercises') {
    return prisma.exercise.findMany({
      select: { id: true, name: true, muscle_groups: true },
      orderBy: { name: 'asc' },
    });
  }

  if (name === 'create_template') {
    const { exercises = [], name: tplName, objective, notes } = input as {
      exercises?: ToolInput[];
      name: string;
      objective?: string;
      notes?: string;
    };
    const template = await prisma.workoutTemplate.create({
      data: { name: tplName, objective: objective ?? null, notes: notes ?? null },
    });
    if (exercises.length > 0) {
      await prisma.workoutTemplateExercise.createMany({
        data: exercises.map((e, i) => ({
          template_id: template.id,
          exercise_id: e.exercise_id as string,
          block_name: (e.block_name as string) ?? null,
          order_index: i,
          sets: (e.sets as number) ?? null,
          reps: (e.reps as number) ?? null,
          target_weight: (e.target_weight as number) ?? null,
          rest_seconds: (e.rest_seconds as number) ?? null,
          notes: (e.notes as string) ?? null,
        })),
      });
    }
    return { success: true, id: template.id, name: template.name };
  }

  if (name === 'create_workout_plan') {
    const { exercises = [], date, name: planName, objective, notes } = input as {
      exercises?: ToolInput[];
      date: string;
      name?: string;
      objective?: string;
      notes?: string;
    };
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (date < todayStr) {
      throw new Error(`Cannot create a workout plan for a past date (${date}). Only today or future dates are allowed.`);
    }
    const planDate = new Date(`${date}T12:00:00`);
    const existing = await prisma.workoutPlan.findUnique({ where: { date: planDate } });
    if (existing) {
      throw new Error(`A workout plan already exists for ${date} (id: ${existing.id}). Ask the user if they want to update it or choose a different date.`);
    }
    const plan = await prisma.workoutPlan.create({
      data: {
        date: planDate,
        name: planName ?? null,
        objective: objective ?? null,
        notes: notes ?? null,
      },
    });
    if (exercises.length > 0) {
      await prisma.workoutPlanExercise.createMany({
        data: exercises.map((e, i) => ({
          workout_plan_id: plan.id,
          exercise_id: e.exercise_id as string,
          block_name: (e.block_name as string) ?? null,
          order_index: i,
          sets: (e.sets as number) ?? null,
          reps: (e.reps as number) ?? null,
          target_weight: (e.target_weight as number) ?? null,
          rest_seconds: (e.rest_seconds as number) ?? null,
          notes: (e.notes as string) ?? null,
        })),
      });
    }
    return { success: true, id: plan.id, date };
  }

  if (name === 'create_mesocycle') {
    const { name: cycName, start_date, end_date, goal, notes } = input as {
      name: string;
      start_date: string;
      end_date: string;
      goal?: string;
      notes?: string;
    };
    const mesocycle = await prisma.mesocycle.create({
      data: {
        name: cycName,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        goal: goal ?? null,
        notes: notes ?? null,
      },
    });
    return { success: true, id: mesocycle.id, name: mesocycle.name };
  }

  throw new Error(`Unknown tool: ${name}`);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const customPrompt: string | undefined = body.prompt;
  const history: Array<{ role: 'user' | 'assistant'; content: string }> = body.messages ?? [];

  const [objective, sessions, latestWeight] = await Promise.all([
    prisma.userObjective.findFirst(),
    prisma.workoutSession.findMany({
      include: {
        exercises: {
          include: { exercise: { select: { name: true, muscle_groups: true } } },
        },
      },
      orderBy: { date: 'desc' },
      take: 10,
    }),
    prisma.weightEntry.findFirst({ orderBy: { date: 'desc' } }),
  ]);

  const age = objective?.birthday
    ? Math.floor((Date.now() - new Date(objective.birthday).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  const serializedSessions = serialize(sessions) as Array<{
    date: string;
    status: string;
    actual_start_time: string | null;
    actual_end_time: string | null;
    exercises?: Array<{
      exercise?: { name: string };
      actual_weight?: number;
      reps?: number;
      sets?: number;
      status: string;
    }>;
  }>;

  const todayLocal = new Date();
  const today = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`;

  const systemPrompt = `You are a personal fitness coach AI. You can analyze the user's workout history and goals, provide recommendations, AND create workout templates, workout plans, and mesocycles on demand using your available tools.

When the user asks you to create something (a template, workout, or mesocycle), use the appropriate tool. Always call list_exercises first to get valid exercise IDs before creating templates or workout plans. Today's date is ${today}.

IMPORTANT: You must never create or modify anything for a past date. Workout plans may only be created for today or future dates. Never attempt to alter, overwrite, or delete existing workout history — that data is read-only and must be preserved.

When not creating something, provide specific, actionable recommendations. Be encouraging and practical. Format responses with clear sections using markdown.

--- USER PROFILE ---
${objective ? `Goal: ${objective.objective_text ?? 'Not set'}
Strategy: ${objective.strategy_text ?? 'Not set'}` : 'No fitness goals set yet.'}
${age ? `Age: ${age} years old` : ''}
${objective?.height_cm ? `Height: ${objective.height_cm}cm` : ''}
${latestWeight ? `Current weight: ${Number(latestWeight.weight_kg)}kg (logged ${serialize(latestWeight.date)})` : ''}
${objective?.equipment ? `Available equipment: ${objective.equipment}` : ''}
${objective?.personal_context ? `Personal context: ${objective.personal_context}` : ''}

--- RECENT WORKOUT SESSIONS (last ${serializedSessions.length}) ---
${serializedSessions.map(s => `
- ${s.date}: ${s.status.toUpperCase()}${s.actual_start_time && s.actual_end_time ? ` (${Math.round((new Date(s.actual_end_time).getTime() - new Date(s.actual_start_time).getTime()) / 60000)} min)` : ''}
  Exercises: ${s.exercises?.map(e =>
    `${e.exercise?.name ?? 'Unknown'} ${e.actual_weight ? `@ ${e.actual_weight}kg` : ''} ${e.sets && e.reps ? `${e.sets}×${e.reps}` : ''} [${e.status}]`
  ).join(', ') ?? 'None'}
`).join('')}`;

  const newUserMessage = customPrompt?.trim() || 'Por favor proporcioná sugerencias de sobrecarga progresiva, evaluación de recuperación y ajustes a mi plan de entrenamiento semanal.';

  const claudeMessages: Anthropic.MessageParam[] = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: newUserMessage },
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (text: string) => controller.enqueue(encoder.encode(text));

      try {
        const messages: Anthropic.MessageParam[] = [...claudeMessages];

        while (true) {
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 4096,
            system: systemPrompt,
            tools,
            messages,
          });

          for (const block of response.content) {
            if (block.type === 'text' && block.text) {
              emit(block.text);
            }
          }

          if (response.stop_reason !== 'tool_use') break;

          const toolUseBlocks = response.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
          );

          messages.push({ role: 'assistant', content: response.content });

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const toolUse of toolUseBlocks) {
            if (toolUse.name !== 'list_exercises') {
              const label =
                toolUse.name === 'create_template'
                  ? `Creating template: **${(toolUse.input as ToolInput).name}**`
                  : toolUse.name === 'create_workout_plan'
                  ? `Creating workout plan for **${(toolUse.input as ToolInput).date}**`
                  : `Creating mesocycle: **${(toolUse.input as ToolInput).name}**`;
              emit(`\n_${label}..._\n\n`);
            }

            try {
              const result = await executeTool(toolUse.name, toolUse.input as ToolInput);
              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: JSON.stringify(result),
              });
            } catch (err) {
              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolUse.id,
                is_error: true,
                content: err instanceof Error ? err.message : 'Tool execution failed',
              });
            }
          }

          messages.push({ role: 'user', content: toolResults });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'AI error';
        emit(`\n\n**Error:** ${msg}`);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
