'use client';
import { useEffect, useState } from 'react';
import { WorkoutSession } from '@/types';

interface Props {
  session: WorkoutSession;
  onClose: () => void;
}

export function SessionSummary({ session, onClose }: Props) {
  const [aiComment, setAiComment] = useState('');
  const [loadingAI, setLoadingAI] = useState(true);

  const doneExercises = session.exercises?.filter(e => e.status === 'done') ?? [];
  const skippedExercises = session.exercises?.filter(e => e.status === 'not_done') ?? [];
  const prs = doneExercises.filter(e => {
    return false;
  });

  const totalVolume = doneExercises.reduce((sum, e) => {
    return sum + (e.actual_weight ?? 0) * (e.sets ?? 1) * (e.reps ?? 1);
  }, 0);

  useEffect(() => {
    const exerciseNames = doneExercises.map(e =>
      `${e.exercise?.name ?? 'Unknown'}: ${e.sets}×${e.reps} @ ${e.actual_weight ?? '?'}kg`
    ).join(', ');

    fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `En una oración (máximo 20 palabras), dá un comentario motivador sobre este entreno: ${exerciseNames}. Sé específico y enérgico. Responde en español.`,
      }),
    }).then(async res => {
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;
      let text = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value);
        setAiComment(text);
      }
    }).catch(() => {
      setAiComment('¡Gran trabajo hoy!');
    }).finally(() => setLoadingAI(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">¡Entreno Completo! 💪</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-green-600">{doneExercises.length}</p>
            <p className="text-xs text-green-500 mt-0.5">Completados</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-orange-600">{Math.round(totalVolume)}</p>
            <p className="text-xs text-orange-500 mt-0.5">Total kg</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-slate-600">{skippedExercises.length}</p>
            <p className="text-xs text-slate-400 mt-0.5">Omitidos</p>
          </div>
        </div>

        {/* Exercises done */}
        {doneExercises.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Ejercicios</p>
            <div className="flex flex-col gap-1.5">
              {doneExercises.map(e => (
                <div key={e.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{e.exercise?.name ?? 'Unknown'}</span>
                  <span className="text-slate-500 text-xs">
                    {e.sets && e.reps ? `${e.sets}×${e.reps}` : ''}
                    {e.actual_weight ? ` @ ${e.actual_weight}kg` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI comment */}
        <div className="bg-orange-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-orange-500 mb-1">Entrenador IA</p>
          {loadingAI ? (
            <div className="h-4 bg-orange-100 rounded animate-pulse" />
          ) : (
            <p className="text-sm text-orange-800">{aiComment}</p>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-orange-500 text-white rounded-xl py-3 font-semibold text-sm hover:bg-orange-600 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
