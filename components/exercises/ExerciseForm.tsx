'use client';
import { useState, useEffect, useRef } from 'react';
import { Exercise } from '@/types';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

interface Props {
  exercise?: Exercise | null;
  allMuscleGroups?: string[];
  onSaved: () => void;
  onClose: () => void;
}

interface Resource { title: string; url: string }

export function ExerciseForm({ exercise, allMuscleGroups = [], onSaved, onClose }: Props) {
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [mgInput, setMgInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [resources, setResources] = useState<Resource[]>([{ title: '', url: '' }]);
  const [saving, setSaving] = useState(false);
  const mgInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (exercise) {
      setName(exercise.name);
      setInstructions(exercise.instructions ?? '');
      setMuscleGroups(exercise.muscle_groups ?? []);
      setResources(exercise.resources?.length > 0 ? exercise.resources : [{ title: '', url: '' }]);
    }
  }, [exercise]);

  const suggestions = allMuscleGroups.filter(
    g => g.toLowerCase().includes(mgInput.toLowerCase()) && !muscleGroups.includes(g)
  );

  function addGroup(group: string) {
    const trimmed = group.trim();
    if (trimmed && !muscleGroups.includes(trimmed)) {
      setMuscleGroups(prev => [...prev, trimmed]);
    }
    setMgInput('');
    setShowSuggestions(false);
    mgInputRef.current?.focus();
  }

  function removeGroup(group: string) {
    setMuscleGroups(prev => prev.filter(g => g !== group));
  }

  function handleMgKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && mgInput.trim()) {
      e.preventDefault();
      addGroup(mgInput);
    } else if (e.key === 'Backspace' && !mgInput && muscleGroups.length > 0) {
      setMuscleGroups(prev => prev.slice(0, -1));
    }
  }

  function updateResource(idx: number, field: keyof Resource, value: string) {
    setResources(rs => rs.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  }

  async function save() {
    if (!name.trim()) { toast('El nombre del ejercicio es requerido', 'error'); return; }
    const pendingGroups = mgInput.trim() ? [...muscleGroups, mgInput.trim()] : muscleGroups;
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        instructions: instructions.trim() || null,
        muscle_groups: pendingGroups,
        resources: resources.filter(r => r.url.trim()),
      };
      if (exercise) {
        await fetch(`/api/exercises/${exercise.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
      } else {
        await fetch('/api/exercises', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
      }
      toast(exercise ? 'Ejercicio actualizado' : 'Ejercicio creado');
      onSaved();
      onClose();
    } catch { toast('Error al guardar', 'error'); }
    finally { setSaving(false); }
  }

  return (
    <Modal open onClose={onClose} title={exercise ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}>
      <div className="flex flex-col gap-3">
        <Input label="Nombre *" placeholder="ej. Sentadilla con barra" value={name} onChange={e => setName(e.target.value)} />

        {/* Muscle groups tag input */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Grupos musculares</label>
          <div
            className="min-h-10 px-2 py-1.5 rounded-xl border border-slate-200 bg-white flex flex-wrap gap-1.5 items-center cursor-text focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-transparent"
            onClick={() => mgInputRef.current?.focus()}
          >
            {muscleGroups.map(g => (
              <span key={g} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                {g}
                <button type="button" onClick={() => removeGroup(g)} className="hover:text-orange-900 leading-none">×</button>
              </span>
            ))}
            <div className="relative flex-1 min-w-[120px]">
              <input
                ref={mgInputRef}
                type="text"
                value={mgInput}
                onChange={e => { setMgInput(e.target.value); setShowSuggestions(true); }}
                onKeyDown={handleMgKeyDown}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder={muscleGroups.length === 0 ? 'ej. Cuádriceps, Isquiotibiales…' : ''}
                className="w-full text-sm bg-transparent outline-none py-0.5 placeholder:text-slate-400"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[160px] max-h-48 overflow-y-auto">
                  {suggestions.map(g => (
                    <button
                      key={g}
                      type="button"
                      onMouseDown={() => addGroup(g)}
                      className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700"
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-400">Presioná Enter o coma para agregar un grupo</p>
        </div>

        <Textarea
          label="Instrucciones"
          placeholder="Cómo realizar el ejercicio..."
          value={instructions}
          rows={5}
          onChange={e => setInstructions(e.target.value)}
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Recursos / Videos</label>
            <button
              onClick={() => setResources(rs => [...rs, { title: '', url: '' }])}
              className="text-xs text-orange-500 font-medium hover:underline"
            >
              + Agregar enlace
            </button>
          </div>
          {resources.map((r, i) => (
            <div key={i} className="flex flex-col gap-1.5 p-3 bg-slate-50 rounded-xl">
              <Input placeholder="Título (ej. Video tutorial)" value={r.title} onChange={e => updateResource(i, 'title', e.target.value)} />
              <Input placeholder="URL (https://...)" type="url" value={r.url} onChange={e => updateResource(i, 'url', e.target.value)} />
              {resources.length > 1 && (
                <button
                  onClick={() => setResources(rs => rs.filter((_, idx) => idx !== i))}
                  className="text-xs text-red-400 hover:text-red-600 self-end"
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" loading={saving} onClick={save}>Guardar</Button>
        </div>
      </div>
    </Modal>
  );
}
