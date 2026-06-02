'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { AIDigest } from '@/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function renderMarkdown(text: string) {
  return text
    .split('\n')
    .map((line, i) => {
      if (line.startsWith('## ')) {
        return <p key={i} className="font-semibold text-slate-800 mt-3 mb-1 first:mt-0">{line.slice(3)}</p>;
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return (
          <div key={i} className="flex gap-2 text-sm text-slate-600">
            <span className="text-orange-400 mt-0.5 shrink-0">•</span>
            <span>{line.slice(2)}</span>
          </div>
        );
      }
      if (line.trim()) {
        return <p key={i} className="text-sm text-slate-600">{line}</p>;
      }
      return null;
    })
    .filter(Boolean);
}

export function WeeklyDigest() {
  const [open, setOpen] = useState(false);
  const { data, isLoading, mutate } = useSWR<AIDigest>('/api/ai/weekly-digest', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  async function refresh() {
    await fetch('/api/ai/weekly-digest', { method: 'DELETE' });
    await mutate();
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <div>
            <p className="font-semibold text-slate-800 text-sm">Resumen Semanal IA</p>
            {data && !isLoading && (
              <p className="text-xs text-slate-400">Semana del {data.week_start}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin" />
          )}
          <svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-slate-50">
          {isLoading ? (
            <div className="flex flex-col gap-2 pt-3">
              <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-slate-100 rounded animate-pulse w-full" />
              <div className="h-3 bg-slate-100 rounded animate-pulse w-2/3" />
              <p className="text-xs text-slate-400 mt-2">Generando tu resumen semanal...</p>
            </div>
          ) : data?.content ? (
            <div className="pt-3 flex flex-col gap-1">
              {renderMarkdown(data.content)}
              <button
                onClick={refresh}
                className="mt-3 text-xs text-orange-500 hover:text-orange-600 font-medium self-start"
              >
                Actualizar ↺
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-400 pt-3">Sin datos aún — completá algunos entrenos primero.</p>
          )}
        </div>
      )}
    </div>
  );
}
