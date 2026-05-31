'use client';
import { use, useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { useWorkoutPlan } from '@/hooks/useWorkoutPlan';
import { useWorkoutSession } from '@/hooks/useWorkoutSession';
import { useExercises } from '@/hooks/useExercises';
import { WorkoutHeader } from '@/components/workout/WorkoutHeader';
import { BlockMinimap, BlockChipData } from '@/components/workout/BlockMinimap';
import { ActiveBlockView } from '@/components/workout/ActiveBlockView';
import { SessionSummary } from '@/components/workout/SessionSummary';
import { PageSpinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { WorkoutPlanExercise, WorkoutSessionExercise, ProgressSuggestion } from '@/types';

function buildBlocks(planExercises: WorkoutPlanExercise[]) {
  const sorted = [...planExercises].sort((a, b) => a.order_index - b.order_index);
  const blockMap = new Map<string, WorkoutPlanExercise[]>();
  for (const ex of sorted) {
    const key = ex.block_name ?? '';
    if (!blockMap.has(key)) blockMap.set(key, []);
    blockMap.get(key)!.push(ex);
  }
  return Array.from(blockMap.entries()).map(([name, exercises]) => ({ name, exercises }));
}

// Compact row used in the full-plan review drawer
function FullPlanRow({ planEx, se }: { planEx: WorkoutPlanExercise; se: WorkoutSessionExercise | null }) {
  const name = se?.replaced_exercise?.name ?? planEx.exercise?.name ?? '…';
  const isDone = se?.status === 'done';
  const isSkipped = se?.status === 'not_done';
  return (
    <div className={`flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0 ${isSkipped ? 'opacity-50' : ''}`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs ${
        isDone ? 'bg-green-100 text-green-600' : isSkipped ? 'bg-red-50 text-red-400' : 'bg-slate-100 text-slate-300'
      }`}>
        {isDone ? '✓' : isSkipped ? '✕' : '○'}
      </div>
      <span className="text-sm text-slate-800 flex-1 truncate">{name}</span>
      {planEx.sets && planEx.reps && (
        <span className="text-xs text-slate-400 shrink-0">{planEx.sets}×{planEx.reps}</span>
      )}
      {planEx.target_weight && (
        <span className="text-xs text-slate-400 shrink-0">{planEx.target_weight}kg</span>
      )}
    </div>
  );
}

export default function WorkoutPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = use(params);

  const { plan, isLoading: loadingPlan, mutate: mutatePlan } = useWorkoutPlan(date);
  const { session, isLoading: loadingSession, mutate: mutateSession } = useWorkoutSession(date);
  const { exercises: allExercises, isLoading: loadingExercises } = useExercises();

  const [suggestions, setSuggestions] = useState<Record<string, ProgressSuggestion>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [activeBlockIndex, setActiveBlockIndex] = useState(0);
  const [showFullPlan, setShowFullPlan] = useState(false);

  const lsKey = `workout-sets-${date}`;
  const [setsDone, setSetsDone] = useState<Record<string, number>>(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem(lsKey) ?? '{}'); }
    catch { return {}; }
  });

  const loading = loadingPlan || loadingSession || loadingExercises;

  function refresh() {
    mutateSession();
    mutatePlan();
  }

  // Sync session's done exercises into local set counter
  useEffect(() => {
    if (!session?.exercises || !plan?.exercises) return;
    setSetsDone(prev => {
      const next = { ...prev };
      let changed = false;
      for (const se of session.exercises ?? []) {
        if (!se.workout_plan_exercise_id) continue;
        const planEx = plan.exercises?.find(e => e.id === se.workout_plan_exercise_id);
        if (!planEx) continue;
        const full = planEx.sets ?? 1;
        if (se.status === 'done' && (next[se.workout_plan_exercise_id] ?? 0) < full) {
          next[se.workout_plan_exercise_id] = full;
          changed = true;
        }
      }
      if (changed) localStorage.setItem(lsKey, JSON.stringify(next));
      return changed ? next : prev;
    });
  }, [session?.exercises, plan?.exercises, lsKey]);

  // Auto-advance to first incomplete block (runs once after data loads)
  useEffect(() => {
    const planExs = plan?.exercises;
    const ses = session?.exercises ?? [];
    if (!planExs?.length) return;
    const blocks = buildBlocks(planExs);
    const firstIncomplete = blocks.findIndex(b =>
      !b.exercises.every(ex => {
        const se = ses.find(s => s.workout_plan_exercise_id === ex.id);
        if (se?.status === 'not_done') return true;
        // Read from localStorage directly since setsDone state may not be synced yet
        const localSets = (() => {
          try { return (JSON.parse(localStorage.getItem(lsKey) ?? '{}') as Record<string, number>)[ex.id] ?? 0; }
          catch { return 0; }
        })();
        return localSets >= (ex.sets ?? 1);
      })
    );
    if (firstIncomplete >= 0) setActiveBlockIndex(firstIncomplete);
  // Only run once after initial data load
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingPlan, loadingSession]);

  useEffect(() => {
    if (!plan?.exercises?.length) return;
    const ids = plan.exercises.map(e => e.exercise_id).join(',');
    fetch(`/api/progress/suggestions?exerciseIds=${ids}`)
      .then(r => r.json())
      .then(setSuggestions)
      .catch(() => {});
  }, [plan]);

  useEffect(() => {
    if (session?.status === 'done' && (session.exercises?.length ?? 0) > 0) {
      setShowSummary(true);
    }
  }, [session?.status, session?.exercises?.length]);

  if (loading) return <PageSpinner />;

  const planExercises: WorkoutPlanExercise[] = plan?.exercises ?? [];
  const sessionExercises: WorkoutSessionExercise[] = session?.exercises ?? [];

  function getSessionExercise(planExId: string): WorkoutSessionExercise | null {
    return sessionExercises.find(se => se.workout_plan_exercise_id === planExId) ?? null;
  }

  async function ensureSession(): Promise<string> {
    if (session?.id) return session.id;
    const resp = await fetch('/api/workout-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, status: 'done' }),
    });
    const created = await resp.json();
    await mutateSession();
    return created.id;
  }

  const blocks = buildBlocks(planExercises);

  const minimapBlocks: BlockChipData[] = blocks.map(b => ({
    name: b.name,
    exerciseCount: b.exercises.length,
    doneCount: b.exercises.filter(ex => {
      const se = getSessionExercise(ex.id);
      if (se?.status === 'not_done') return true;
      return (setsDone[ex.id] ?? 0) >= (ex.sets ?? 1);
    }).length,
  }));

  async function handleSetComplete(planExId: string) {
    const planEx = planExercises.find(e => e.id === planExId);
    if (!planEx) return;

    const current = setsDone[planExId] ?? 0;
    const newCount = current + 1;

    const updated = { ...setsDone, [planExId]: newCount };
    setSetsDone(updated);
    localStorage.setItem(lsKey, JSON.stringify(updated));

    if (newCount >= (planEx.sets ?? 1)) {
      try {
        const sid = session?.id ?? await ensureSession();
        const se = getSessionExercise(planExId);
        if (se) {
          await fetch(`/api/workout-sessions/${sid}/exercises/${se.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'done' }),
          });
        } else {
          await fetch(`/api/workout-sessions/${sid}/exercises`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workout_session_id: sid,
              workout_plan_exercise_id: planExId,
              exercise_id: planEx.exercise_id,
              order_index: planEx.order_index,
              sets: planEx.sets,
              reps: planEx.reps,
              status: 'done',
            }),
          });
        }
        mutateSession();
      } catch { /* silent — local state is correct */ }
    }
  }

  const activeBlock = blocks[activeBlockIndex];
  const displayDate = format(parseISO(date), 'EEEE, MMM d');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">{displayDate}</h1>
        <Link href="/planner">
          <Button size="sm" variant="outline">Edit plan</Button>
        </Link>
      </div>

      <WorkoutHeader
        date={date}
        session={session}
        planName={plan?.name}
        planObjective={plan?.objective}
        onSessionUpdated={refresh}
      />

      {planExercises.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <p className="text-slate-400 mb-3">No workout planned for this day</p>
          <Link href="/planner">
            <Button variant="outline">Plan a workout</Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Block minimap — shown when there are named blocks or multiple blocks */}
          {(blocks.length > 1 || blocks[0]?.name) && (
            <BlockMinimap
              blocks={minimapBlocks}
              activeIndex={activeBlockIndex}
              onSelect={setActiveBlockIndex}
            />
          )}

          {/* Focused active-block view */}
          {activeBlock && (
            <ActiveBlockView
              blockName={activeBlock.name}
              exercises={activeBlock.exercises}
              sessionExercises={sessionExercises}
              allExercises={allExercises}
              sessionId={session?.id ?? ''}
              onEnsureSession={ensureSession}
              onUpdated={refresh}
              suggestions={suggestions}
              setsDone={setsDone}
              onSetComplete={handleSetComplete}
              onNext={() => setActiveBlockIndex(i => Math.min(i + 1, blocks.length - 1))}
              isLastBlock={activeBlockIndex === blocks.length - 1}
            />
          )}

          {/* Full plan review */}
          <button
            onClick={() => setShowFullPlan(v => !v)}
            className="flex items-center justify-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 py-1 transition-colors"
          >
            <span>{showFullPlan ? '↑ Hide' : '↓ Review full plan'}</span>
          </button>

          {showFullPlan && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {blocks.map((block, bi) => (
                <div key={block.name || `b${bi}`} className="px-4 py-3 border-b border-slate-100 last:border-0">
                  {(block.name || blocks.length > 1) && (
                    <button
                      onClick={() => { setActiveBlockIndex(bi); setShowFullPlan(false); }}
                      className="flex items-center gap-2 mb-2 w-full group text-left"
                    >
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-orange-500 transition-colors">
                        {block.name || `Block ${bi + 1}`}
                      </span>
                      {bi === activeBlockIndex && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">current</span>
                      )}
                      <span className="text-xs text-slate-300 group-hover:text-orange-400 transition-colors ml-auto">focus →</span>
                    </button>
                  )}
                  {block.exercises.map(planEx => (
                    <FullPlanRow key={planEx.id} planEx={planEx} se={getSessionExercise(planEx.id)} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showSummary && session && (
        <SessionSummary session={session} onClose={() => setShowSummary(false)} />
      )}
    </div>
  );
}
