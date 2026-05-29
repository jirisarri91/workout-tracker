'use client';
import { useState } from 'react';
import { Exercise } from '@/types';

interface Props {
  exercise: Exercise;
}

export function ExerciseInstructions({ exercise }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-orange-100 hover:text-orange-600 text-xs font-bold transition-colors shrink-0"
        title="Exercise info"
      >
        i
      </button>

      {open && (
        <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700">
          {exercise.muscle_groups?.length > 0 && (
            <p className="text-xs text-slate-400 mb-2 font-medium">
              {exercise.muscle_groups.join(' · ')}
            </p>
          )}
          {exercise.instructions && (
            <p className="whitespace-pre-wrap leading-relaxed">{exercise.instructions}</p>
          )}
          {exercise.resources?.length > 0 && (
            <div className="mt-3 flex flex-col gap-1">
              {exercise.resources.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-orange-500 hover:underline text-xs font-medium"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0">
                    <path d="m22 8-6-6H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {r.title}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
