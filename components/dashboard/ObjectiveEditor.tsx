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
  const [heightCm, setHeightCm] = useState('');
  const [personalContext, setPersonalContext] = useState('');
  const [equipment, setEquipment] = useState('');
  const [saving, setSaving] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (objectives) {
      setObjective(objectives.objective_text ?? '');
      setStrategy(objectives.strategy_text ?? '');
      setBirthday(objectives.birthday ?? '');
      setHeightCm(objectives.height_cm != null ? String(objectives.height_cm) : '');
      setPersonalContext(objectives.personal_context ?? '');
      setEquipment(objectives.equipment ?? '');
    }
  }, [objectives]);

  function scheduleAutoSave(values: {
    obj: string; strat: string; bday: string;
    height: string; context: string; equip: string;
  }) {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => save(values), 800);
  }

  async function save({ obj, strat, bday, height, context, equip }: {
    obj: string; strat: string; bday: string;
    height: string; context: string; equip: string;
  }) {
    setSaving(true);
    try {
      await fetch('/api/objectives', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objective_text: obj,
          strategy_text: strat,
          birthday: bday || null,
          height_cm: height ? Number(height) : null,
          personal_context: context || null,
          equipment: equip || null,
        }),
      });
      await mutate();
    } catch {
      toast('Failed to save objectives', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field: string, value: string) {
    const values = {
      obj: objective, strat: strategy, bday: birthday,
      height: heightCm, context: personalContext, equip: equipment,
    };
    switch (field) {
      case 'obj': setObjective(value); values.obj = value; break;
      case 'strat': setStrategy(value); values.strat = value; break;
      case 'bday': setBirthday(value); values.bday = value; break;
      case 'height': setHeightCm(value); values.height = value; break;
      case 'context': setPersonalContext(value); values.context = value; break;
      case 'equip': setEquipment(value); values.equip = value; break;
    }
    scheduleAutoSave(values);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800">My Fitness Objectives</h3>
        {saving && <Spinner className="w-4 h-4" />}
      </div>
      <div className="flex flex-col gap-3">

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Birthday"
            type="date"
            value={birthday}
            onChange={e => handleChange('bday', e.target.value)}
          />
          <Input
            label="Height (cm)"
            type="number"
            min={100}
            max={250}
            placeholder="e.g. 175"
            value={heightCm}
            onChange={e => handleChange('height', e.target.value)}
          />
        </div>

        <Textarea
          label="Goal"
          placeholder="e.g. Build muscle, lose 5kg, run a 5k..."
          value={objective}
          rows={3}
          onChange={e => handleChange('obj', e.target.value)}
        />

        <Textarea
          label="Training Strategy"
          placeholder="e.g. 4 days/week strength training, progressive overload..."
          value={strategy}
          rows={4}
          onChange={e => handleChange('strat', e.target.value)}
        />

        <div>
          <Textarea
            label="Equipment"
            placeholder={"List the equipment you have access to:\ne.g. Full gym, barbell, dumbbells, pull-up bar, resistance bands, cable machine..."}
            value={equipment}
            rows={3}
            onChange={e => handleChange('equip', e.target.value)}
          />
        </div>

        <div>
          <Textarea
            label="Personal Context (for AI)"
            placeholder={"Help the AI understand your situation:\n• Any injuries or physical limitations?\n• Current activity level (sedentary, lightly active, very active)?\n• How many days/week and hours/day are you available to train?\n• Sleep quality, stress levels, or recovery capacity?\n• Anything else the AI coach should know?"}
            value={personalContext}
            rows={6}
            onChange={e => handleChange('context', e.target.value)}
          />
        </div>

        <p className="text-xs text-slate-400">Auto-saved · Used by AI Coach for recommendations</p>
      </div>
    </div>
  );
}
