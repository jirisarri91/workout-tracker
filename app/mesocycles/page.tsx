'use client';
import { useState } from 'react';
import { format, parseISO, differenceInWeeks } from 'date-fns';
import { useMesocycles } from '@/hooks/useMesocycles';
import { Mesocycle } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function MesocyclesPage() {
  const { mesocycles, mutate } = useMesocycles();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const editing = mesocycles.find(m => m.id === editId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Mesociclos</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setShowAI(true); setShowForm(false); }}>Plan IA</Button>
          <Button size="sm" onClick={() => { setShowForm(true); setEditId(null); setShowAI(false); }}>+ Nuevo</Button>
        </div>
      </div>

      <p className="text-sm text-slate-400">Bloques de entrenamiento (4–8 semanas) con objetivos estructurados y progresión de volumen.</p>

      {(showForm || editId) && (
        <MesocycleForm
          initial={editing}
          onSave={async (data) => {
            if (editId) {
              await fetch(`/api/mesocycles/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            } else {
              await fetch('/api/mesocycles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            }
            await mutate();
            setShowForm(false);
            setEditId(null);
          }}
          onCancel={() => { setShowForm(false); setEditId(null); }}
        />
      )}

      {showAI && (
        <AIMesocycleGenerator
          onCreated={async (meso) => {
            await fetch('/api/mesocycles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(meso) });
            await mutate();
            setShowAI(false);
            toast('¡Mesociclo creado!', 'success');
          }}
          onCancel={() => setShowAI(false)}
        />
      )}

      {mesocycles.length === 0 && !showForm && !showAI && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <p className="text-slate-400 text-sm mb-3">Sin mesociclos todavía.</p>
          <p className="text-slate-400 text-xs">Creá bloques de entrenamiento estructurados con objetivos de sobrecarga progresiva.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {mesocycles.map(m => (
          <MesocycleCard
            key={m.id}
            mesocycle={m}
            onEdit={() => { setEditId(m.id); setShowForm(false); setShowAI(false); }}
            onDelete={async () => {
              await fetch(`/api/mesocycles/${m.id}`, { method: 'DELETE' });
              await mutate();
            }}
          />
        ))}
      </div>
    </div>
  );
}

function MesocycleCard({ mesocycle: m, onEdit, onDelete }: { mesocycle: Mesocycle; onEdit: () => void; onDelete: () => void }) {
  const weeks = differenceInWeeks(parseISO(m.end_date), parseISO(m.start_date)) + 1;
  const now = format(new Date(), 'yyyy-MM-dd');
  const isActive = m.start_date <= now && m.end_date >= now;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-4 ${isActive ? 'border-orange-200 bg-orange-50/30' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900">{m.name}</span>
            {isActive && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">Activo</span>}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {format(parseISO(m.start_date), 'MMM d')} – {format(parseISO(m.end_date), 'MMM d, yyyy')} · {weeks} semana{weeks !== 1 ? 's' : ''}
          </p>
          {m.goal && <p className="text-sm text-slate-600 mt-1.5">{m.goal}</p>}
          {m.notes && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{m.notes}</p>}
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={onEdit} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button onClick={onDelete} className="text-slate-400 hover:text-red-400 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function MesocycleForm({ initial, onSave, onCancel }: {
  initial: Mesocycle | null;
  onSave: (data: { name: string; start_date: string; end_date: string; goal: string; notes: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [startDate, setStartDate] = useState(initial?.start_date ?? format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(initial?.end_date ?? '');
  const [goal, setGoal] = useState(initial?.goal ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name || !startDate || !endDate) return;
    setSaving(true);
    await onSave({ name, start_date: startDate, end_date: endDate, goal, notes });
    setSaving(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-4 flex flex-col gap-3">
      <h3 className="font-semibold text-slate-800">{initial ? 'Editar' : 'Nuevo'} Mesociclo</h3>
      <Input label="Nombre" placeholder="ej. Bloque de Fuerza 1" value={name} onChange={e => setName(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Fecha inicio" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <Input label="Fecha fin" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
      </div>
      <Input label="Objetivo" placeholder="ej. Desarrollar fuerza máxima, aumentar 1RM" value={goal} onChange={e => setGoal(e.target.value)} />
      <Textarea label="Notas / plan semana a semana" rows={4} placeholder="Semana 1: 3×8 @ 70%..." value={notes} onChange={e => setNotes(e.target.value)} />
      <div className="flex gap-2">
        <Button onClick={submit} loading={saving} disabled={!name || !startDate || !endDate}>Guardar</Button>
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
}

function AIMesocycleGenerator({ onCreated, onCancel }: {
  onCreated: (data: { name: string; start_date: string; end_date: string; goal: string; notes: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [intent, setIntent] = useState('');
  const [weeks, setWeeks] = useState('6');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState('');

  async function generate() {
    if (!intent) return;
    setLoading(true);
    setPreview('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Design a ${weeks}-week mesocycle starting ${startDate}. Goal: ${intent}.
Return a structured plan with:
1. Mesocycle name
2. Weekly progression outline (Week 1: ..., Week 2: ..., etc.)
3. Key lifts to focus on
4. Deload week recommendation

Be specific and practical.`,
        }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        let text = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value);
          setPreview(text);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function buildEnd() {
    const d = new Date(startDate);
    d.setDate(d.getDate() + Number(weeks) * 7 - 1);
    return format(d, 'yyyy-MM-dd');
  }

  return (
    <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-4 flex flex-col gap-3">
      <h3 className="font-semibold text-slate-800">Generador de Mesociclos IA</h3>
      <Input label="Fecha inicio" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
      <Input label="Duración (semanas)" type="number" min="4" max="16" value={weeks} onChange={e => setWeeks(e.target.value)} />
      <Textarea
        label="Objetivo y contexto"
        placeholder="ej. Desarrollar fuerza para competencia de powerlifting, 4 días/semana, foco en sentadilla y peso muerto..."
        rows={3}
        value={intent}
        onChange={e => setIntent(e.target.value)}
      />
      {!preview && (
        <Button onClick={generate} loading={loading} disabled={!intent}>Generar con IA</Button>
      )}
      {preview && (
        <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
          {preview}
        </div>
      )}
      {preview && !loading && (
        <div className="flex gap-2">
          <Button onClick={() => onCreated({
            name: `Bloque de ${weeks} Semanas`,
            start_date: startDate,
            end_date: buildEnd(),
            goal: intent,
            notes: preview,
          })}>
            Guardar Mesociclo
          </Button>
          <Button variant="ghost" onClick={() => setPreview('')}>Regenerar</Button>
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        </div>
      )}
      {!preview && (
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
      )}
    </div>
  );
}
