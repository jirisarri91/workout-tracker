'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const STORAGE_KEY = 'ai_trainer_messages';

export default function AICoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  async function sendMessage() {
    const text = prompt.trim();
    if (!text || loading) return;

    setPrompt('');
    setLoading(true);
    setStreamingContent('');

    const history = messages;
    setMessages(prev => [...prev, { role: 'user', content: text }]);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, messages: history }),
      });

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        setStreamingContent(fullResponse);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }]);
      setStreamingContent('');
    } catch (err) {
      const errorMsg = `Error: ${err instanceof Error ? err.message : 'Error desconocido'}`;
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
      setStreamingContent('');
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function resetConversation() {
    setMessages([]);
    setStreamingContent('');
    setPrompt('');
    localStorage.removeItem(STORAGE_KEY);
  }

  const hasMessages = messages.length > 0 || !!streamingContent;

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Entrenador IA</h1>
          <p className="text-sm text-slate-500 mt-1">
            Hacé preguntas, pedí planes, o preguntá de seguimiento sobre la misma conversación.
          </p>
        </div>
        {hasMessages && (
          <button
            onClick={resetConversation}
            className="text-xs text-slate-400 hover:text-slate-600 mt-1 shrink-0"
          >
            Nueva conversación
          </button>
        )}
      </div>

      {!hasMessages && (
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

      {hasMessages && (
        <div className="flex flex-col gap-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-orange-500 text-white rounded-br-md'
                    : 'bg-white border border-slate-100 shadow-sm text-slate-700 rounded-bl-md prose prose-sm max-w-none whitespace-pre-wrap'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed bg-white border border-slate-100 shadow-sm text-slate-700 whitespace-pre-wrap">
                {streamingContent}
                <span className="inline-block w-1.5 h-4 ml-0.5 bg-slate-400 animate-pulse rounded-sm align-middle" />
              </div>
            </div>
          )}

          {loading && !streamingContent && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1 items-center">
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      <div className="sticky bottom-0 bg-slate-50 pt-2">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex gap-2 items-end p-2">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasMessages ? 'Preguntá algo de seguimiento...' : 'ej. ¿Cómo puedo mejorar mi sentadilla? Creá una plantilla de empuje...'}
            rows={1}
            disabled={loading}
            className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none min-h-[36px] max-h-32 py-1.5 px-2 overflow-y-auto"
            style={{ height: 'auto' }}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
            }}
          />
          <Button
            onClick={sendMessage}
            loading={loading}
            disabled={!prompt.trim()}
            size="sm"
            className="shrink-0"
          >
            Enviar
          </Button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-1">Enter para enviar · Shift+Enter para nueva línea</p>
      </div>
    </div>
  );
}
