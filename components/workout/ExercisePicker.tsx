'use client';
import { useState } from 'react';
import { Exercise } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

interface Props {
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export function ExercisePicker({ exercises, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');

  const filtered = exercises.filter(e =>
    e.name.toLowerCase().includes(query.toLowerCase()) ||
    e.muscle_groups?.some(m => m.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <Modal open onClose={onClose} title="Choose Exercise">
      <div className="flex flex-col gap-3">
        <Input
          placeholder="Search exercises..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        <div className="flex flex-col gap-1 max-h-80 overflow-y-auto -mx-1 px-1">
          {filtered.map(ex => (
            <button
              key={ex.id}
              onClick={() => { onSelect(ex); onClose(); }}
              className="flex flex-col items-start p-3 rounded-xl hover:bg-orange-50 text-left transition-colors"
            >
              <span className="font-medium text-slate-800 text-sm">{ex.name}</span>
              {ex.muscle_groups?.length > 0 && (
                <span className="text-xs text-slate-400 mt-0.5">{ex.muscle_groups.join(' · ')}</span>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-slate-400 py-6 text-sm">No exercises found</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
