'use client';
import { useState } from 'react';
import { Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function AICoachPage() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  async function askAI() {
    setLoading(true);
    setResponse('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() || undefined }),
      });

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setResponse(r => r + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      setResponse(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Entrenador IA</h1>
        <p className="text-sm text-slate-500 mt-1">
          Obtené recomendaciones, o pedime que cree plantillas, planes de entreno y mesociclos.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
        <Textarea
          label="Preguntá algo específico (opcional)"
          placeholder="ej. Creá una plantilla de empuje, planificá un entreno de piernas para mañana, creá un mesociclo de hipertrofia de 6 semanas, ¿cómo debería ajustar mis sentadillas?"
          value={prompt}
          rows={3}
          onChange={e => setPrompt(e.target.value)}
        />
        <Button onClick={askAI} loading={loading} size="lg" className="w-full">
          {loading ? 'Analizando tus entrenos...' : '🤖 Obtener Recomendaciones'}
        </Button>
      </div>

      {response && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <h2 className="font-semibold text-slate-800 mb-3">El Entrenador IA dice:</h2>
          <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">
            {response}
          </div>
        </div>
      )}

      {!response && !loading && (
        <div className="bg-orange-50 rounded-2xl border border-orange-100 p-4 text-sm text-orange-700">
          <p className="font-medium mb-1">💡 Consejos para mejores resultados:</p>
          <ul className="list-disc list-inside space-y-1 text-orange-600">
            <li>Configurá tus objetivos de fitness en la pantalla de Inicio</li>
            <li>Pedime que cree una plantilla, planifique un entreno para una fecha, o arme un mesociclo</li>
            <li>Registrá tus entrenos consistentemente para mejores recomendaciones</li>
            <li>Anotá los pesos reales y observaciones después de cada ejercicio</li>
          </ul>
        </div>
      )}
    </div>
  );
}
