import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Tag,
  Loader2,
} from 'lucide-react';
import type { InterviewQuestion } from '../types';

interface AnswerCardProps {
  item: InterviewQuestion;
  index: number;
  isLatest: boolean;
}

/* ── markdown → html (simple, safe) ── */
function md(raw: string): string {
  // 1. escape HTML
  let t = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 2. fenced code blocks  ```lang … ```
  t = t.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) => {
    return (
      '<pre class="bg-[#0b1120] rounded-lg p-4 my-3 overflow-x-auto text-[13px] leading-relaxed font-mono text-emerald-300 border border-[#1e293b]">' +
      code.trim() +
      '</pre>'
    );
  });

  // 3. inline code
  t = t.replace(/`([^`]+)`/g, '<code class="bg-[#1e293b] text-indigo-300 px-1.5 py-0.5 rounded text-[13px] font-mono">$1</code>');

  // 4. bold
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');

  // 5. italic
  t = t.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="text-slate-300">$1</em>');

  // 6. headings (### then ##)
  t = t.replace(/^### (.+)$/gm, '<h4 class="text-indigo-300 font-semibold text-sm mt-4 mb-1">$1</h4>');
  t = t.replace(/^## (.+)$/gm, '<h3 class="text-indigo-300 font-bold mt-4 mb-1">$1</h3>');

  // 7. blockquote
  t = t.replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-2 border-indigo-500 pl-3 text-slate-400 italic my-2">$1</blockquote>');

  // 8. unordered list items
  t = t.replace(/^- (.+)$/gm, '<li class="ml-5 list-disc text-slate-300 text-sm leading-relaxed">$1</li>');

  // 9. ordered list items
  t = t.replace(/^\d+\.\s(.+)$/gm, '<li class="ml-5 list-decimal text-slate-300 text-sm leading-relaxed">$1</li>');

  // 10. Table grouping (Group consecutive | lines into one table)
  const lines = t.split('\n');
  const processedLines: string[] = [];
  let currentTable: string[][] = [];

  // 11. double newlines → paragraph break, single → <br>
  t = t.replace(/\n\n/g, '</p><p class="mt-1">');
  t = t.replace(/\n/g, '<br/>');

  return '<p>' + t.trim() + '</p>';
}

export default function AnswerCard({ item, index, isLatest }: AnswerCardProps) {
  const [expanded, setExpanded] = useState(isLatest);
  const [copied, setCopied] = useState(false);

  // auto-expand the latest card whenever it updates
  useEffect(() => {
    if (isLatest) setExpanded(true);
  }, [isLatest, item.answer]);

  const answerHtml = useMemo(
    () => (item.answer ? md(item.answer) : ''),
    [item.answer]
  );

  const copyToClipboard = () => {
    if (!item.answer) return;
    navigator.clipboard.writeText(item.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const time = new Date(item.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const isLoading = !!item.isProcessing;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={
        'rounded-2xl overflow-hidden border transition-all ' +
        (isLatest
          ? 'border-indigo-500/40 shadow-lg shadow-indigo-500/5 bg-[#0f172a]/80 backdrop-blur-xl'
          : 'border-slate-700/40 bg-[#0f172a]/60 backdrop-blur-md')
      }
    >
      {/* ── question header ── */}
      <button
        type="button"
        className="w-full p-4 text-left hover:bg-slate-800/30 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-red-400 font-bold text-xs">Q{index + 1}</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm leading-relaxed">
              {item.question}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                {time}
              </span>
              {item.category && (
                <span className="flex items-center gap-1 text-xs text-indigo-400">
                  <Tag className="w-3 h-3" />
                  {item.category}
                </span>
              )}
              {typeof item.confidence === 'number' && item.confidence > 0 && (
                <span
                  className={
                    'text-xs px-2 py-0.5 rounded-full ' +
                    (item.confidence >= 80
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : item.confidence >= 50
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400')
                  }
                >
                  {item.confidence}% match
                </span>
              )}
              {isLoading && (
                <span className="flex items-center gap-1 text-xs text-indigo-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Generating…
                </span>
              )}
            </div>
          </div>

          <span className="text-slate-500 shrink-0 mt-1">
            {expanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </span>
        </div>
      </button>

      {/* ── answer body ── */}
      {expanded && (
        <div className="border-t border-slate-700/30 p-3">
          {/* heading row */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-indigo-500/20 flex items-center justify-center">
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              ) : (
                <Brain className="w-3.5 h-3.5 text-indigo-400" />
              )}
            </div>
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              {isLoading ? 'Generating Answer…' : 'AI Answer'}
            </span>

            {!isLoading && item.answer && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard();
                }}
                className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-400 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            )}
          </div>

          {/* content */}
          {isLoading ? (
            <div className="space-y-2.5 animate-pulse">
              <div className="h-3.5 bg-slate-800 rounded-full w-full" />
              <div className="h-3.5 bg-slate-800 rounded-full w-5/6" />
              <div className="h-3.5 bg-slate-800 rounded-full w-4/6" />
              <div className="h-3.5 bg-slate-800 rounded-full w-3/6" />
            </div>
          ) : answerHtml ? (
            <div
              className="text-sm text-slate-300 leading-relaxed [&_pre]:whitespace-pre-wrap [&_li+li]:mt-0.5"
              dangerouslySetInnerHTML={{ __html: answerHtml }}
            />
          ) : (
            <p className="text-slate-500 text-sm italic">No answer generated.</p>
          )}
        </div>
      )}
    </motion.div>
  );
}
