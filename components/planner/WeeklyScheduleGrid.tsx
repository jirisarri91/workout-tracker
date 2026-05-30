'use client';
import { useState } from 'react';
import { WorkoutTemplate, WeeklyScheduleSlot } from '@/types';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

// 0=Sun, 1=Mon, ..., 6=Sat — matches JS Date.getDay()
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface Props {
  slots: WeeklyScheduleSlot[];
  templates: WorkoutTemplate[];
  onSaved: () => void;
}

export function WeeklyScheduleGrid({ slots, templates, onSaved }: Props) {
  const [draft, setDraft] = useState<Record<number, string | null>>(() => {
    const map: Record<number, string | null> = {};
    for (let d = 0; d < 7; d++) {
      const slot = slots.find(s => s.day_of_week === d);
      map[d] = slot?.template_id ?? null;
    }
    return map;
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Sync when slots change from parent (e.g. after save)
  const slotsKey = slots.map(s => `${s.day_of_week}:${s.template_id}`).join(',');
  const [prevSlotsKey, setPrevSlotsKey] = useState(slotsKey);
  if (slotsKey !== prevSlotsKey) {
    setPrevSlotsKey(slotsKey);
    const map: Record<number, string | null> = {};
    for (let d = 0; d < 7; d++) {
      const slot = slots.find(s => s.day_of_week === d);
      map[d] = slot?.template_id ?? null;
    }
    setDraft(map);
  }

  async function save() {
    setSaving(true);
    try {
      const slotPayload = Array.from({ length: 7 }, (_, d) => ({
        day_of_week: d,
        template_id: draft[d] ?? null,
      }));
      await fetch('/api/weekly-schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: slotPayload }),
      });
      toast('Schedule saved!');
      onSaved();
    } catch {
      toast('Failed to save schedule', 'error');
    } finally {
      setSaving(false);
    }
  }

  const templateById = Object.fromEntries(templates.map(t => [t.id, t]));

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {DAYS.map((day, d) => {
            const selectedId = draft[d] ?? null;
            const selectedTemplate = selectedId ? templateById[selectedId] : null;
            return (
              <div key={d} className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 text-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{day}</span>
                </div>
                <div className="flex-1">
                  {templates.length === 0 ? (
                    <span className="text-sm text-slate-400 italic">No templates yet</span>
                  ) : (
                    <select
                      value={selectedId ?? ''}
                      onChange={e => setDraft(prev => ({ ...prev, [d]: e.target.value || null }))}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-slate-700"
                    >
                      <option value="">Rest day</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                {selectedTemplate && (
                  <div className="shrink-0">
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100 rounded-full px-2.5 py-1">
                      {(selectedTemplate.exercises?.length ?? 0)} ex
                    </span>
                  </div>
                )}
                {!selectedId && (
                  <div className="shrink-0 w-14 text-right">
                    <span className="text-xs text-slate-300">rest</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {templates.length > 0 && (
        <Button onClick={save} loading={saving} className="w-full">Save Schedule</Button>
      )}

      {templates.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
          Create workout templates first, then assign them to days here.
        </div>
      )}
    </div>
  );
}
