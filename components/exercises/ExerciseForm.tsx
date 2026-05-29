'use client';
import { useState, useEffect } from 'react';
import { Exercise } from '@/types';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

interface Props {
  exercise?: Exercise | null;
  onSaved: () => void;
  onClose: () => void;
}

interface Resource { title: string; url: string }

export function ExerciseForm({ exercise, onSaved, onClose }: Props) {
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [muscleGroupsStr, setMuscleGroupsStr] = useState('');
  const [resources, setResources] = useState<Resource[]>([{ title: '', url: '' }]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (exercise) {
      setName(exercise.name);
      setInstructions(exercise.instructions ?? '');
      setMuscleGroupsStr(exercise.muscle_groups?.join(', ') ?? '');
      setResources(exercise.resources?.length > 0 ? exercise.resources : [{ title: '', url: '' }]);
    }
  }, [exercise]);

  function updateResource(idx: number, field: keyof Resource, value: string) {
    setResources(rs => rs.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  }

  async function save() {
    if (!name.trim()) { toast('Exercise name is required', 'error'); return; }
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        instructions: instructions.trim() || null,
        muscle_groups: muscleGroupsStr.split(',').map(s => s.trim()).filter(Boolean),
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
      toast(exercise ? 'Exercise updated' : 'Exercise created');
      onSaved();
      onClose();
    } catch { toast('Failed to save', 'error'); }
    finally { setSaving(false); }
  }

  return (
    <Modal open onClose={onClose} title={exercise ? 'Edit Exercise' : 'New Exercise'}>
      <div className="flex flex-col gap-3">
        <Input label="Name *" placeholder="e.g. Barbell Squat" value={name} onChange={e => setName(e.target.value)} />
        <Input
          label="Muscle groups (comma separated)"
          placeholder="e.g. Quadriceps, Hamstrings, Glutes"
          value={muscleGroupsStr}
          onChange={e => setMuscleGroupsStr(e.target.value)}
        />
        <Textarea
          label="Instructions"
          placeholder="How to perform the exercise..."
          value={instructions}
          rows={5}
          onChange={e => setInstructions(e.target.value)}
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Resources / Videos</label>
            <button
              onClick={() => setResources(rs => [...rs, { title: '', url: '' }])}
              className="text-xs text-orange-500 font-medium hover:underline"
            >
              + Add link
            </button>
          </div>
          {resources.map((r, i) => (
            <div key={i} className="flex flex-col gap-1.5 p-3 bg-slate-50 rounded-xl">
              <Input placeholder="Title (e.g. Tutorial Video)" value={r.title} onChange={e => updateResource(i, 'title', e.target.value)} />
              <Input placeholder="URL (https://...)" type="url" value={r.url} onChange={e => updateResource(i, 'url', e.target.value)} />
              {resources.length > 1 && (
                <button
                  onClick={() => setResources(rs => rs.filter((_, idx) => idx !== i))}
                  className="text-xs text-red-400 hover:text-red-600 self-end"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" loading={saving} onClick={save}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}
