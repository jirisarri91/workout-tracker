'use client';
import { useState, useEffect, useRef } from 'react';
import { useObjectives } from '@/hooks/useObjectives';
import { Input, Textarea } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';

export function ObjectiveEditor() {
  const { objectives, mutate } = useObjectives();
  const [objective, setObjective] = useState('');
  const [strategy, setStrategy] = useState('');
  const [birthday, setBirthday] = useState('');
  const [saving, setSaving] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (objectives) {
      setObjective(objectives.objective_text ?? '');
      setStrategy(objectives.strategy_text ?? '');
      setBirthday(objectives.birthday ?? '');
    }
  }, [objectives]);

  function scheduleAutoSave(newObjective: string, newStrategy: string, newBirthday: string) {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => save(newObjective, newStrategy, newBirthday), 800);
  }

  async function save(obj: string, strat: string, bday: string) {
    setSaving(true);
    try {
      await fetch('/api/objectives', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective_text: obj, strategy_text: strat, birthday: bday || null }),
      });
      await mutate();
    } catch {
      toast('Failed to save objectives', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800">My Fitness Objectives</h3>
        {saving && <Spinner className="w-4 h-4" />}
      </div>
      <div className="flex flex-col gap-3">
        <Input
          label="Birthday"
          type="date"
          value={birthday}
          onChange={e => {
            setBirthday(e.target.value);
            scheduleAutoSave(objective, strategy, e.target.value);
          }}
        />
        <Textarea
          label="Goal"
          placeholder="e.g. Build muscle, lose 5kg, run a 5k..."
          value={objective}
          rows={3}
          onChange={e => {
            setObjective(e.target.value);
            scheduleAutoSave(e.target.value, strategy, birthday);
          }}
        />
        <Textarea
          label="Training Strategy"
          placeholder="e.g. 4 days/week strength training, progressive overload..."
          value={strategy}
          rows={4}
          onChange={e => {
            setStrategy(e.target.value);
            scheduleAutoSave(objective, e.target.value, birthday);
          }}
        />
        <p className="text-xs text-slate-400">Auto-saved · Used by AI Coach for recommendations</p>
      </div>
    </div>
  );
}
