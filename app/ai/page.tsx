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
        <h1 className="text-2xl font-bold text-slate-900">AI Coach</h1>
        <p className="text-sm text-slate-500 mt-1">
          Get recommendations, or ask me to create templates, workout plans, and mesocycles.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
        <Textarea
          label="Ask something specific (optional)"
          placeholder="e.g. Create a push day template, plan a leg workout for tomorrow, create a 6-week hypertrophy mesocycle, how should I adjust my squats?"
          value={prompt}
          rows={3}
          onChange={e => setPrompt(e.target.value)}
        />
        <Button onClick={askAI} loading={loading} size="lg" className="w-full">
          {loading ? 'Analyzing your workouts...' : '🤖 Get Recommendations'}
        </Button>
      </div>

      {response && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <h2 className="font-semibold text-slate-800 mb-3">AI Coach Says:</h2>
          <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">
            {response}
          </div>
        </div>
      )}

      {!response && !loading && (
        <div className="bg-orange-50 rounded-2xl border border-orange-100 p-4 text-sm text-orange-700">
          <p className="font-medium mb-1">💡 Tips for best results:</p>
          <ul className="list-disc list-inside space-y-1 text-orange-600">
            <li>Set your fitness goals on the Home screen</li>
            <li>Ask me to create a template, plan a workout for a date, or build a mesocycle</li>
            <li>Track your workouts consistently for better recommendations</li>
            <li>Record actual weights and observations after each exercise</li>
          </ul>
        </div>
      )}
    </div>
  );
}
