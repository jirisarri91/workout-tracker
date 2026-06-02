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
      toast('Error al guardar objetivos', 'error');
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
        <h3 className="font-semibold text-slate-800">Mis Objetivos de Fitness</h3>
        {saving && <Spinner className="w-4 h-4" />}
      </div>
      <div className="flex flex-col gap-3">

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Fecha de nacimiento"
            type="date"
            value={birthday}
            onChange={e => handleChange('bday', e.target.value)}
          />
          <Input
            label="Altura (cm)"
            type="number"
            min={100}
            max={250}
            placeholder="ej. 175"
            value={heightCm}
            onChange={e => handleChange('height', e.target.value)}
          />
        </div>

        <Textarea
          label="Objetivo"
          placeholder="ej. Ganar músculo, perder 5kg, correr 5k..."
          value={objective}
          rows={3}
          onChange={e => handleChange('obj', e.target.value)}
        />

        <Textarea
          label="Estrategia de Entrenamiento"
          placeholder="ej. 4 días/semana de entrenamiento de fuerza, sobrecarga progresiva..."
          value={strategy}
          rows={4}
          onChange={e => handleChange('strat', e.target.value)}
        />

        <div>
          <Textarea
            label="Equipamiento"
            placeholder={"Listá el equipamiento al que tenés acceso:\nej. Gimnasio completo, barra, mancuernas, barra de dominadas, bandas elásticas, polea..."}
            value={equipment}
            rows={3}
            onChange={e => handleChange('equip', e.target.value)}
          />
        </div>

        <div>
          <Textarea
            label="Contexto Personal (para la IA)"
            placeholder={"Ayudá a la IA a entender tu situación:\n• ¿Tenés lesiones o limitaciones físicas?\n• Nivel de actividad actual (sedentario, levemente activo, muy activo)?\n• ¿Cuántos días/semana y horas/día podés entrenar?\n• ¿Calidad de sueño, niveles de estrés o capacidad de recuperación?\n• ¿Algo más que el entrenador IA debería saber?"}
            value={personalContext}
            rows={6}
            onChange={e => handleChange('context', e.target.value)}
          />
        </div>

        <p className="text-xs text-slate-400">Guardado automático · Usado por el Entrenador IA</p>
      </div>
    </div>
  );
}
