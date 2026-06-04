'use client';
import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  contextHint?: string;
}

export function WorkoutAIChat({ contextHint }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      textareaRef.current?.focus();
    }
  }, [open]);

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

    const systemContext = contextHint
      ? `El usuario está en medio de un entrenamiento. Contexto del entreno: ${contextHint}. Respondé de forma concisa y práctica.`
      : 'El usuario está en medio de un entrenamiento. Respondé de forma concisa y práctica.';

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, messages: history, systemContext }),
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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🤖</span>
          <span className="text-sm font-semibold text-slate-700">Chat IA</span>
          <span className="text-xs text-slate-400">Preguntá sustitutos, técnica, etc.</span>
        </div>
        <span className="text-slate-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-slate-100">
          {/* Messages */}
          <div className="flex flex-col gap-2.5 p-3 max-h-72 overflow-y-auto">
            {messages.length === 0 && !streamingContent && (
              <p className="text-xs text-slate-400 text-center py-2">
                Preguntá, por ejemplo: "¿Qué reemplaza al press de banca?"
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-orange-500 text-white rounded-br-sm'
                    : 'bg-slate-100 text-slate-700 rounded-bl-sm whitespace-pre-wrap'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-xl rounded-bl-sm px-3 py-2 text-xs leading-relaxed bg-slate-100 text-slate-700 whitespace-pre-wrap">
                  {streamingContent}
                  <span className="inline-block w-1 h-3 ml-0.5 bg-slate-400 animate-pulse rounded-sm align-middle" />
                </div>
              </div>
            )}
            {loading && !streamingContent && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-xl rounded-bl-sm px-3 py-2">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-100 p-2 flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Preguntá algo..."
              rows={1}
              disabled={loading}
              className="flex-1 resize-none bg-slate-50 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none min-h-[32px] max-h-20 py-2 px-3 overflow-y-auto border border-slate-200 focus:border-orange-300 focus:ring-1 focus:ring-orange-200 transition-colors"
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 80)}px`;
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !prompt.trim()}
              className="h-8 px-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-colors shrink-0"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
