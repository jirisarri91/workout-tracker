'use client';
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useWorkoutPlans, useWorkoutPlan } from '@/hooks/useWorkoutPlan';
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates';
import { useWeeklySchedule } from '@/hooks/useWeeklySchedule';
import { useExercises } from '@/hooks/useExercises';
import { PlannerDatePicker } from '@/components/planner/PlannerDatePicker';
import { PlanEditor } from '@/components/planner/PlanEditor';
import { TemplateEditor } from '@/components/planner/TemplateEditor';
import { WeeklyScheduleGrid } from '@/components/planner/WeeklyScheduleGrid';
import { AIPlanGenerator } from '@/components/planner/AIPlanGenerator';
import { PageSpinner } from '@/components/ui/Spinner';
import { WorkoutTemplate } from '@/types';

type Tab = 'date' | 'templates' | 'schedule';
type TemplateView = 'list' | 'edit';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function PlannerPage() {
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const [tab, setTab] = useState<Tab>('date');
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [templateView, setTemplateView] = useState<TemplateView>('list');
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { plans, isLoading: loadingPlans, mutate: mutatePlans } = useWorkoutPlans(year, month);
  const { plan, isLoading: loadingPlan, mutate: mutatePlan } = useWorkoutPlan(selectedDate);
  const { exercises, isLoading: loadingExercises } = useExercises();
  const { templates, isLoading: loadingTemplates, mutate: mutateTemplates } = useWorkoutTemplates();
  const { slots, isLoading: loadingSchedule, mutate: mutateSchedule } = useWeeklySchedule();

  function onPlanSaved() { mutatePlan(); mutatePlans(); }

  // Detect if a template is scheduled for the selected date's weekday
  const selectedDow = parseISO(selectedDate).getDay();
  const scheduledSlot = slots.find(s => s.day_of_week === selectedDow);
  const scheduledTemplate = scheduledSlot?.template_id
    ? templates.find(t => t.id === scheduledSlot.template_id)
    : null;

  async function applyTemplate(template: WorkoutTemplate) {
    if (!template.exercises?.length) return;
    const body = {
      date: selectedDate,
      name: template.name,
      objective: template.objective ?? null,
      notes: template.notes ?? null,
      exercises: template.exercises.map((e, i) => ({
        exercise_id: e.exercise_id,
        block_name: e.block_name,
        order_index: i,
        sets: e.sets,
        reps: e.reps,
        duration_seconds: e.duration_seconds,
        target_weight: e.target_weight,
        rest_seconds: e.rest_seconds,
        notes: e.notes,
      })),
    };
    if (plan) {
      await fetch(`/api/workout-plans/${plan.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
    } else {
      await fetch('/api/workout-plans', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
    }
    onPlanSaved();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Planner</h1>
        {tab === 'date' && <AIPlanGenerator date={selectedDate} onPlanCreated={onPlanSaved} />}
        {tab === 'templates' && templateView === 'list' && (
          <button
            onClick={() => { setEditingTemplate(null); setTemplateView('edit'); }}
            className="flex items-center gap-1.5 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-xl transition-colors"
          >
            + New template
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
        {(['date', 'templates', 'schedule'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t === 'templates') setTemplateView('list'); }}
            className={`flex-1 text-sm font-medium py-1.5 rounded-lg capitalize transition-colors ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Date tab */}
      {tab === 'date' && (
        <>
          <PlannerDatePicker plans={plans} selectedDate={selectedDate} onSelect={setSelectedDate} />

          {/* Scheduled template banner */}
          {scheduledTemplate && !loadingSchedule && !loadingPlan && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-orange-800">
                  {DAY_NAMES[selectedDow]}s are scheduled for <span className="italic">{scheduledTemplate.name}</span>
                </p>
                <p className="text-xs text-orange-600 mt-0.5">
                  {scheduledTemplate.exercises?.length ?? 0} exercises
                  {plan ? ' · Plan already exists for this day' : ''}
                </p>
              </div>
              <button
                onClick={() => applyTemplate(scheduledTemplate)}
                className="shrink-0 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-xl transition-colors"
              >
                {plan ? 'Re-apply' : 'Apply'}
              </button>
            </div>
          )}

          {(loadingPlan || loadingExercises) ? (
            <PageSpinner />
          ) : (
            <PlanEditor
              date={selectedDate}
              plan={plan}
              allExercises={exercises}
              allPlans={plans ?? []}
              onSaved={onPlanSaved}
            />
          )}
        </>
      )}

      {/* Templates tab */}
      {tab === 'templates' && (
        <>
          {loadingExercises || loadingTemplates ? (
            <PageSpinner />
          ) : templateView === 'edit' ? (
            <TemplateEditor
              template={editingTemplate}
              allExercises={exercises}
              onSaved={saved => { mutateTemplates(); setTemplateView('list'); setEditingTemplate(null); }}
              onCancel={() => { setTemplateView('list'); setEditingTemplate(null); }}
            />
          ) : (
            <TemplateList
              templates={templates}
              onEdit={t => { setEditingTemplate(t); setTemplateView('edit'); }}
              onDeleted={() => mutateTemplates()}
            />
          )}
        </>
      )}

      {/* Schedule tab */}
      {tab === 'schedule' && (
        loadingSchedule || loadingTemplates ? (
          <PageSpinner />
        ) : (
          <WeeklyScheduleGrid
            slots={slots}
            templates={templates}
            onSaved={() => mutateSchedule()}
          />
        )
      )}
    </div>
  );
}

// Inline template list — simple enough not to need its own file
function TemplateList({
  templates,
  onEdit,
  onDeleted,
}: {
  templates: WorkoutTemplate[];
  onEdit: (t: WorkoutTemplate) => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function deleteTemplate(id: string) {
    setDeleting(id);
    await fetch(`/api/workout-templates/${id}`, { method: 'DELETE' });
    onDeleted();
    setDeleting(null);
  }

  if (templates.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
        <p className="text-slate-500 text-sm">No templates yet.</p>
        <p className="text-slate-400 text-xs mt-1">Create one with the button above.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {templates.map(t => {
        const exCount = t.exercises?.length ?? 0;
        const muscles = Array.from(new Set(
          t.exercises?.flatMap(e => e.exercise?.muscle_groups ?? []) ?? []
        )).slice(0, 3);

        return (
          <div key={t.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900">{t.name}</h3>
                {t.objective && <p className="text-xs text-slate-500 mt-0.5 truncate">{t.objective}</p>}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs text-slate-400">{exCount} exercise{exCount !== 1 ? 's' : ''}</span>
                  {muscles.map(mg => (
                    <span key={mg} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{mg}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onEdit(t)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => deleteTemplate(t.id)}
                  disabled={deleting === t.id}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 disabled:opacity-40"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
