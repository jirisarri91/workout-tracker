import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { anthropic } from '@/lib/anthropic';
import { prisma } from '@/lib/prisma';
import { serialize } from '@/lib/serialize';

type ToolInput = Record<string, unknown>;

const exerciseItemSchema = {
  type: 'object',
  properties: {
    exercise_id: { type: 'string', description: 'ID from list_exercises' },
    block_name: { type: 'string', description: 'e.g. "Calentamiento", "Principal", "Finalizador"' },
    sets: { type: 'number' },
    reps: { type: 'number' },
    target_weight: { type: 'number', description: 'kg' },
    rest_seconds: { type: 'number' },
    notes: { type: 'string' },
  },
  required: ['exercise_id'],
} as const;

const tools: Anthropic.Tool[] = [
  {
    name: 'list_exercises',
    description:
      'List all available exercises with their IDs, names, and muscle groups. Always call this before creating or updating templates or workout plans to get valid exercise IDs.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'list_templates',
    description: 'List all existing workout templates with their exercises. Call this before updating a template to get valid template IDs.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'list_workout_plans',
    description: 'List upcoming workout plans (today and future) with their exercises. Call this before updating a plan to get valid plan IDs.',
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
          items: exerciseItemSchema,
        },
      },
      required: ['name', 'exercises'],
    },
  },
  {
    name: 'update_template',
    description: 'Update an existing workout template. Call list_templates first to get the template ID. If exercises are provided, they replace the current exercise list entirely.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Template ID from list_templates' },
        name: { type: 'string', description: 'New template name (optional)' },
        objective: { type: 'string', description: 'New objective (optional)' },
        notes: { type: 'string', description: 'New notes (optional)' },
        exercises: {
          type: 'array',
          description: 'New exercise list — replaces all existing exercises if provided',
          items: exerciseItemSchema,
        },
      },
      required: ['id'],
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
          items: exerciseItemSchema,
        },
      },
      required: ['date', 'exercises'],
    },
  },
  {
    name: 'update_workout_plan',
    description: 'Update an existing workout plan for today or a future date. Cannot modify plans that have already been completed (done). Call list_workout_plans first to get valid plan IDs. If exercises are provided, they replace the current exercise list entirely.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Plan ID from list_workout_plans' },
        name: { type: 'string', description: 'New plan name (optional)' },
        objective: { type: 'string', description: 'New objective (optional)' },
        notes: { type: 'string', description: 'New notes (optional)' },
        exercises: {
          type: 'array',
          description: 'New exercise list — replaces all existing exercises if provided',
          items: exerciseItemSchema,
        },
      },
      required: ['id'],
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

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

async function executeTool(name: string, input: ToolInput): Promise<unknown> {
  if (name === 'list_exercises') {
    return prisma.exercise.findMany({
      select: { id: true, name: true, muscle_groups: true },
      orderBy: { name: 'asc' },
    });
  }

  if (name === 'list_templates') {
    return prisma.workoutTemplate.findMany({
      include: {
        exercises: {
          include: { exercise: { select: { name: true } } },
          orderBy: { order_index: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  if (name === 'list_workout_plans') {
    const todayDate = new Date(`${todayString()}T00:00:00`);
    return prisma.workoutPlan.findMany({
      where: { date: { gte: todayDate } },
      include: {
        exercises: {
          include: { exercise: { select: { name: true } } },
          orderBy: { order_index: 'asc' },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  if (name === 'update_template') {
    const { id, exercises, name: tplName, objective, notes } = input as {
      id: string;
      exercises?: ToolInput[];
      name?: string;
      objective?: string;
      notes?: string;
    };
    const template = await prisma.workoutTemplate.findUnique({ where: { id } });
    if (!template) throw new Error(`Template not found: ${id}`);

    await prisma.workoutTemplate.update({
      where: { id },
      data: {
        ...(tplName !== undefined && { name: tplName }),
        ...(objective !== undefined && { objective }),
        ...(notes !== undefined && { notes }),
      },
    });

    if (exercises !== undefined) {
      await prisma.$transaction(async (tx) => {
        await tx.workoutTemplateExercise.deleteMany({ where: { template_id: id } });
        if (exercises.length > 0) {
          await tx.workoutTemplateExercise.createMany({
            data: exercises.map((e, i) => ({
              template_id: id,
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
      });
    }
    return { success: true, id, name: tplName ?? template.name };
  }

  if (name === 'update_workout_plan') {
    const { id, exercises, name: planName, objective, notes } = input as {
      id: string;
      exercises?: ToolInput[];
      name?: string;
      objective?: string;
      notes?: string;
    };
    const plan = await prisma.workoutPlan.findUnique({
      where: { id },
      include: { sessions: { select: { status: true } } },
    });
    if (!plan) throw new Error(`Workout plan not found: ${id}`);

    const planDateStr = plan.date.toISOString().slice(0, 10);
    if (planDateStr < todayString()) {
      throw new Error(`Cannot modify a workout plan from the past (${planDateStr}). Only today or future plans can be edited.`);
    }
    const isCompleted = plan.sessions.some(s => s.status === 'done');
    if (isCompleted) {
      throw new Error(`The workout plan for ${planDateStr} has already been completed and cannot be modified by AI. Only manual edits are allowed for completed workouts.`);
    }

    await prisma.workoutPlan.update({
      where: { id },
      data: {
        ...(planName !== undefined && { name: planName }),
        ...(objective !== undefined && { objective }),
        ...(notes !== undefined && { notes }),
      },
    });

    if (exercises !== undefined) {
      await prisma.$transaction(async (tx) => {
        await tx.workoutPlanExercise.deleteMany({ where: { workout_plan_id: id } });
        if (exercises.length > 0) {
          await tx.workoutPlanExercise.createMany({
            data: exercises.map((e, i) => ({
              workout_plan_id: id,
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
      });
    }
    return { success: true, id, date: planDateStr };
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
    if (date < todayString()) {
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

  const systemPrompt = `You are a personal fitness coach AI. You can analyze the user's workout history and goals, provide recommendations, AND create or update workout templates, workout plans, and mesocycles on demand using your available tools.

TOOL CALLING RULES — follow these strictly:
1. ALWAYS call list_exercises before any create or update that includes exercises. The exercise IDs in the result are the only valid IDs — never invent or guess them.
2. ALWAYS call list_templates before update_template to get the real template IDs.
3. ALWAYS call list_workout_plans before update_workout_plan to get the real plan IDs.
4. When creating OR updating multiple templates or plans, do them ONE AT A TIME — one tool call per response turn. Wait for each result before calling the next. Never batch multiple create_template or create_workout_plan calls in a single response.
5. Never create or modify anything for a past date.
6. Workout plans may only be created or updated for today or future dates.
7. Never modify a workout plan that has already been completed (status = done) — completed workouts are read-only.
8. Never attempt to alter, overwrite, or delete existing workout history (WorkoutSession records) — that data is read-only and must be preserved.
9. Templates are always editable regardless of date.

Today's date is ${today}.

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

      const completedMutations: string[] = [];
      let loopCount = 0;

      try {
        const messages: Anthropic.MessageParam[] = [...claudeMessages];

        while (loopCount++ < 15) {
          if (loopCount > 1) {
            emit('\n_Procesando..._\n\n');
          }

          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 8192,
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
            const inp = toolUse.input as ToolInput;

            if (toolUse.name === 'list_exercises') {
              emit('\n_Consultando ejercicios disponibles..._\n\n');
            } else if (toolUse.name === 'list_templates') {
              emit('\n_Consultando templates existentes..._\n\n');
            } else if (toolUse.name === 'list_workout_plans') {
              emit('\n_Consultando planes de entrenamiento..._\n\n');
            } else {
              const label =
                toolUse.name === 'create_template'
                  ? `Creando template: **${inp.name}**`
                  : toolUse.name === 'update_template'
                  ? `Actualizando template...`
                  : toolUse.name === 'create_workout_plan'
                  ? `Creando plan de entrenamiento para **${inp.date}**`
                  : toolUse.name === 'update_workout_plan'
                  ? `Actualizando plan de entrenamiento...`
                  : `Creando mesociclo: **${inp.name}**`;
              emit(`\n_${label}_\n\n`);
            }

            try {
              const result = await executeTool(toolUse.name, toolUse.input as ToolInput);
              const r = result as Record<string, unknown>;
              if (toolUse.name === 'create_template') {
                completedMutations.push(`✓ Template creado: **${r.name}**`);
              } else if (toolUse.name === 'update_template') {
                completedMutations.push(`✓ Template actualizado: **${r.name}**`);
              } else if (toolUse.name === 'create_workout_plan') {
                completedMutations.push(`✓ Plan creado para **${r.date}**`);
              } else if (toolUse.name === 'update_workout_plan') {
                completedMutations.push(`✓ Plan actualizado para **${r.date}**`);
              } else if (toolUse.name === 'create_mesocycle') {
                completedMutations.push(`✓ Mesociclo creado: **${r.name}**`);
              }
              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: JSON.stringify(result),
              });
            } catch (err) {
              const errMsg = err instanceof Error ? err.message : 'Error desconocido';
              console.error(`[AI Tool Error] ${toolUse.name}:`, err);
              emit(`\n⚠️ Error en ${toolUse.name}: ${errMsg}\n\n`);
              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolUse.id,
                is_error: true,
                content: errMsg,
              });
            }
          }

          messages.push({ role: 'user', content: toolResults });
        }

        if (completedMutations.length > 0) {
          emit(`\n\n---\n**Cambios guardados:**\n${completedMutations.join('\n')}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'AI error';
        console.error('[AI Route Error]', err);
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
