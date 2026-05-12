import { useState } from 'react';
import {
  X,
  Key,
  User,
  Briefcase,
  Gauge,
  Eye,
  EyeOff,
  Save,
  Code,
  Mic,
  Zap,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Volume2,
} from 'lucide-react';
import type { UserSettings } from '../types';

interface SettingsPanelProps {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
  onClose: () => void;
}

const AI_PROVIDERS = [
  {
    id: 'groq',
    name: '⚡ Groq — FASTEST (Recommended)',
    desc: 'Llama 3.3 70B · ~500ms responses · Free',
    url: 'https://console.groq.com/keys',
    placeholder: 'gsk_...',
    help: 'Sign up → Dashboard → API Keys → Create',
  },
  {
    id: 'gemini',
    name: '🌟 Google Gemini',
    desc: 'Gemini 1.5 Flash · ~1s responses · Free',
    url: 'https://makersuite.google.com/app/apikey',
    placeholder: 'AIza...',
    help: 'Sign in with Google → Create API Key',
  },
  {
    id: 'built-in',
    name: '📚 Built-in (No key needed)',
    desc: 'Offline knowledge base · Instant · Limited topics',
    url: '',
    placeholder: '',
    help: '',
  },
];

export default function SettingsPanel({ settings, onSave, onClose }: SettingsPanelProps) {
  const [local, setLocal] = useState<UserSettings>({ ...settings });
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const provider = AI_PROVIDERS.find((p) => p.id === local.aiModel) || AI_PROVIDERS[0];
  const needsKey = local.aiModel !== 'built-in';
  const hasKey = local.apiKey.trim().length > 10;

  const testApiKey = async () => {
    if (!hasKey) return;
    setTesting(true);
    setTestResult(null);
    try {
      const key = local.apiKey.trim();
      if (local.aiModel === 'groq' || key.startsWith('gsk_')) {
        const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
        
        if (isProduction) {
          const res = await fetch('/api/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetUrl: 'https://api.groq.com/openai/v1/chat/completions',
              method: 'POST',
              headers: { Authorization: 'Bearer ' + key },
              body: {
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: 'Say "OK" in one word.' }],
                max_tokens: 5,
              },
            }),
          });
          if (!res.ok) throw new Error('Status ' + res.status);
          setTestResult('success');
        } else {
          const proxyUrl = 'https://corsproxy.io/?';
          const targetUrl = 'https://api.groq.com/openai/v1/chat/completions';
          const res = await fetch(proxyUrl + encodeURIComponent(targetUrl), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [{ role: 'user', content: 'Say "OK" in one word.' }],
              max_tokens: 5,
            }),
          });
          if (!res.ok) throw new Error('Status ' + res.status);
          setTestResult('success');
        }
      } else if (local.aiModel === 'gemini' || key.startsWith('AIza')) {
        const res = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + key,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Say OK' }] }],
              generationConfig: { maxOutputTokens: 5 },
            }),
          },
        );
        if (!res.ok) throw new Error('Status ' + res.status);
        setTestResult('success');
      } else {
        setTestResult('error');
      }
    } catch {
      setTestResult('error');
    }
    setTesting(false);
  };

  const techOptions = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python',
    'Java', 'Go', 'MongoDB', 'PostgreSQL', 'Docker',
    'AWS', 'GraphQL', 'Next.js', 'Angular', 'Vue.js',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900 flex items-center justify-between p-5 border-b border-slate-700 rounded-t-2xl">
          <h2 className="text-lg font-bold text-white">⚙️ Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* ── AI Provider ── */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-white mb-3">
              <Zap className="w-4 h-4 text-yellow-400" />
              AI Provider (All FREE)
            </label>
            <div className="space-y-2">
              {AI_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setLocal((prev) => ({ ...prev, aiModel: p.id }));
                    setTestResult(null);
                  }}
                  className={`w-full p-3 rounded-xl text-left transition-all border ${
                    local.aiModel === p.id
                      ? 'bg-indigo-500/20 border-indigo-500/50'
                      : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div className="font-semibold text-sm text-white">{p.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── API Key ── */}
          {needsKey && (
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-white mb-1">
                <Key className="w-4 h-4 text-indigo-400" />
                API Key
                {(local.apiKey === import.meta.env.VITE_GROQ_API_KEY || local.apiKey === import.meta.env.VITE_GEMINI_API_KEY) && (
                  <span className="ml-auto px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded-full border border-emerald-500/20 uppercase tracking-wider">
                    System Provided
                  </span>
                )}
              </label>

              {/* How to get key */}
              <div className="mb-3 p-3 bg-slate-800/80 rounded-lg border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1">
                  <strong className="text-slate-300">How to get key:</strong> {provider.help}
                </p>
                <a
                  href={provider.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Open {provider.url.replace('https://', '').split('/')[0]}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Key input */}
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={local.apiKey}
                  onChange={(e) => {
                    setLocal((prev) => ({ ...prev, apiKey: e.target.value }));
                    setTestResult(null);
                  }}
                  placeholder={provider.placeholder}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 pr-20 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-sm"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Test button + status */}
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={testApiKey}
                  disabled={!hasKey || testing}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-all"
                >
                  {testing ? 'Testing…' : 'Test Key'}
                </button>

                {testResult === 'success' && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" /> Working!
                  </span>
                )}
                {testResult === 'error' && (
                  <span className="flex items-center gap-1 text-xs text-red-400 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> Failed — check key
                  </span>
                )}
                {!testResult && hasKey && (
                  <span className="text-xs text-slate-500">Click test to verify</span>
                )}
              </div>

              {/* Vercel Tip */}
              <div className="mt-4 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <div className="flex items-center gap-2 text-indigo-300 mb-1">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Deployment Tip</span>
                </div>
                <p className="text-[11px] text-indigo-200/70 leading-relaxed">
                  To keep your key active permanently on Vercel, add it as an Environment Variable: 
                  <code className="mx-1 text-indigo-300">VITE_GEMINI_API_KEY</code> 
                  in your Vercel Project Settings.
                </p>
              </div>
            </div>
          )}

          {/* ── Role ── */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-white mb-2">
              <Briefcase className="w-4 h-4 text-indigo-400" /> Target Role
            </label>
            <input
              type="text"
              value={local.role}
              onChange={(e) => setLocal((prev) => ({ ...prev, role: e.target.value }))}
              placeholder="e.g. Senior Frontend Developer"
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* ── Experience ── */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-white mb-2">
              <User className="w-4 h-4 text-indigo-400" /> Experience
            </label>
            <select
              value={local.experience}
              onChange={(e) => setLocal((prev) => ({ ...prev, experience: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="fresher">Fresher (0-1 yr)</option>
              <option value="junior">Junior (1-3 yr)</option>
              <option value="mid">Mid (3-5 yr)</option>
              <option value="senior">Senior (5-8 yr)</option>
              <option value="lead">Lead (8+ yr)</option>
            </select>
          </div>

          {/* ── Speed ── */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-white mb-2">
              <Gauge className="w-4 h-4 text-indigo-400" /> Speed
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['fast', 'balanced', 'detailed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setLocal((prev) => ({ ...prev, responseSpeed: s }))}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    local.responseSpeed === s
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {s === 'fast' ? '⚡ Fast' : s === 'balanced' ? '⚖️ Balance' : '📝 Detail'}
                </button>
              ))}
            </div>
          </div>

          {/* ── Dual Voice Capture Toggle ── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Volume2 className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Dual Voice Mode (Beta)</div>
                    <div className="text-[10px] text-slate-500">Capture desktop audio (Zoom/Meet)</div>
                  </div>
                </div>
                <button
                  onClick={() => setLocal(prev => ({ ...prev, dualVoiceMode: !prev.dualVoiceMode }))}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    local.dualVoiceMode ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                    local.dualVoiceMode ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>
              
              {local.dualVoiceMode && (
                <div className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2 text-indigo-300">
                  <p className="flex items-center gap-1.5 mb-1">
                    <Zap className="w-3 h-3" />
                    <strong>Instant Setup:</strong> When you start listening, select "Share Tab Audio" to capture the interviewer.
                  </p>
                </div>
              )}
            </div>

          {/* ── Language ── */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-white mb-2">
              <Mic className="w-4 h-4 text-indigo-400" /> Speech Language
            </label>
            <select
              value={local.language}
              onChange={(e) => setLocal((prev) => ({ ...prev, language: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="en-IN">English (India)</option>
              <option value="hi-IN">Hindi</option>
            </select>
          </div>

          {/* ── Dual-Voice Setup (New Help Section) ── */}
          <div className="p-4 bg-primary-500/5 border border-primary-500/20 rounded-2xl">
            <div className="flex items-center gap-2 mb-2 text-primary-400 font-bold text-xs uppercase tracking-widest">
              <Volume2 className="w-3.5 h-3.5" />
              Dual-Voice Setup Guide
            </div>
            <p className="text-[11px] text-surface-400 leading-relaxed mb-3">
              To capture both <strong>Your Voice</strong> and the <strong>Interviewer's Voice</strong> (from Zoom/Meet), follow these steps:
            </p>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-surface-800 text-[10px] flex items-center justify-center shrink-0 text-white font-bold border border-white/10">1</div>
                <div>
                  <p className="text-xs text-white font-medium">Windows "Stereo Mix"</p>
                  <p className="text-[10px] text-surface-500 mt-0.5">Right-click Speaker icon → Sounds → Recording → Enable "Stereo Mix" and set as Default Device.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-surface-800 text-[10px] flex items-center justify-center shrink-0 text-white font-bold border border-white/10">2</div>
                <div>
                  <p className="text-xs text-white font-medium">External Speakers</p>
                  <p className="text-[10px] text-surface-500 mt-0.5">Alternatively, use external speakers so your microphone picks up the interviewer's voice naturally.</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Tech Stack ── */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-white mb-2">
              <Code className="w-4 h-4 text-indigo-400" /> Tech Stack
            </label>
            <div className="flex flex-wrap gap-1.5">
              {techOptions.map((t) => (
                <button
                  key={t}
                  onClick={() =>
                    setLocal((prev) => ({
                      ...prev,
                      techStack: prev.techStack.includes(t)
                        ? prev.techStack.filter((x) => x !== t)
                        : [...prev.techStack, t],
                    }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    local.techStack.includes(t)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="sticky bottom-0 p-5 border-t border-slate-700 bg-slate-900 rounded-b-2xl">
          <button
            onClick={() => { onSave(local); onClose(); }}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <Save className="w-5 h-5" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
