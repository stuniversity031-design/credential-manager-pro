'use client';
import React, { useState } from 'react';
import { Copy, RefreshCw, Download, Trash2, Eye, EyeOff, Zap, Settings, Lock, User, Mail, Shield, CheckCircle, Brain, Sparkles, Loader } from 'lucide-react';
interface Credential {
  id: number;
  username: string;
  password: string;
  email: string;
  department: string;
  strength: number;
  expiresAt: string;
  copied: boolean;
  aiAnalysis?: { strengthScore: number; recommendations: string[]; riskLevel: string; summary: string; };
}
export default function Page() {
  const [users, setUsers] = useState<Credential[]>([]);
  const [showPW, setShowPW] = useState<Record<number, boolean>>({});
  const [theme, setTheme] = useState('dark');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [expandedSettings, setExpandedSettings] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [config, setConfig] = useState({
    count: 10, passwordLength: 16, usernameStyle: 'professional', includeSymbols: true, includeNumbers: true,
    includeLowercase: true, includeUppercase: true, customPrefix: '', customSuffix: '', emailDomain: 'company.com',
    department: 'Engineering', passwordExpiry: 90,
  });
  const adjectives = 
['azure','brilliant','celestial','dynamic','ethereal','fortified','glorious','harmonious','kinetic','luminous','magnificent','noble','optimal','pristine','quantum','radiant','stellar','triumphant','vivid','zenith'];
  const nouns = 
['atlas','beacon','catalyst','dynamo','falcon','genesis','horizon','knight','legacy','matrix','nebula','oracle','phoenix','raven','sentinel','titan','vault','wizard','zephyr','echo'];
  const firstNames = 
['alex','bailey','casey','dakota','emory','finley','garrett','hardy','irene','jacob','kris','logan','morgan','noah','peyton','quinn','riley','skylar','taylor','val'];
  const lastNames = 
['anderson','bishop','carter','delacroix','evans','foster','graham','hart','iverson','jackson','kane','lincoln','mason','north','oxford','palmer','quinn','ramsey','sterling','taylor'];
  const departments = ['Engineering','Design','Marketing','Sales','Operations','Finance','HR','Executive','Support'];
  const calcStrength = (pwd: string) => {
    let s = 0;
    if (/[a-z]/.test(pwd)) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    if (pwd.length >= 12) s++;
    return s;
  };
  const strengthColor = (s: number) => ['#ef4444','#f97316','#eab308','#84cc16','#22c55e'][Math.min(s, 4)];
  const strengthLabel = (s: number) => ['Very Weak','Weak','Fair','Good','Strong'][Math.min(s, 4)];
  const genPassword = () => {
    let chars = '';
    if (config.includeLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (config.includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (config.includeNumbers) chars += '0123456789';
    if (config.includeSymbols) chars += '!@#$%^&*_-+=';
    let pwd = '';
    for (let i = 0; i < Number(config.passwordLength); i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };
  const genUsername = () => {
    let u = '';
    if (config.usernameStyle === 'professional') {
      u = `${firstNames[Math.floor(Math.random()*firstNames.length)]}.${lastNames[Math.floor(Math.random()*lastNames.length)]}`;
    } else if (config.usernameStyle === 'creative') {
      u = `${adjectives[Math.floor(Math.random()*adjectives.length)]}_${nouns[Math.floor(Math.random()*nouns.length)]}${Math.floor(Math.random()*999)}`;
    } else if (config.usernameStyle === 'numeric') {
      u = `USER${Math.floor(Math.random()*1000000).toString().padStart(6,'0')}`;
    } else {
      const c = 'abcdefghijklmnopqrstuvwxyz0123456789';
      for (let i = 0; i < 10; i++) u += c.charAt(Math.floor(Math.random()*c.length));
    }
    return `${config.customPrefix}${u}${config.customSuffix}`;
  };
  const generate = () => {
    const list: Credential[] = [];
    for (let i = 0; i < Number(config.count); i++) {
      const username = genUsername();
      const password = genPassword();
      list.push({
        id: Date.now() + i, username, password, email: `${username}@${config.emailDomain}`,
        department: config.department, strength: calcStrength(password),
        expiresAt: new Date(Date.now() + Number(config.passwordExpiry) * 86400000).toLocaleDateString(), copied: false,
      });
    }
    setUsers(list);
  };
  const analyzeWithAI = async (user: Credential) => {
    setIsLoadingAI(true);
    try {
      const res = await fetch('/api/analyze-security', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: user.password, username: user.username, count: users.length }),
      });
      const data = await res.json();
      if (data.analysis) setUsers(prev => prev.map(u => u.id === user.id ? { ...u, aiAnalysis: data.analysis } : u));
    } catch (e) {
      alert('AI error. Check your Groq API key.');
    } finally {
      setIsLoadingAI(false);
    }
  };
  const getAISuggestions = async () => {
    setIsLoadingAI(true);
    try {
      const res = await fetch('/api/suggest-credentials', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: config.department, company: config.emailDomain,
          usernameStyle: config.usernameStyle,
          passwordRequirements: `${config.passwordLength} chars, symbols: ${config.includeSymbols}`,
        }),
      });
      const data = await res.json();
      if (data.suggestions) { setAiSuggestions(data.suggestions); setShowAISuggestions(true); }
    } catch (e) {
      alert('AI error. Check your Groq API key.');
    } finally {
      setIsLoadingAI(false);
    }
  };
  const copyOne = (user: Credential) => {
    navigator.clipboard.writeText(`Username: ${user.username}\nPassword: ${user.password}\nEmail: ${user.email}`);
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, copied: true } : u));
    setTimeout(() => setUsers(prev => prev.map(u => u.id === user.id ? { ...u, copied: false } : u)), 1500);
  };
  const copyAll = () => navigator.clipboard.writeText(users.map(u => `Username: ${u.username}\nPassword: ${u.password}\nEmail: ${u.email}`).join('\n\n'));
  const downloadCSV = () => {
    const csv = ['Username,Email,Password,Department,Expires', ...users.map(u => `${u.username},${u.email},${u.password},${u.department},${u.expiresAt}`)].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `credentials_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };
  const downloadJSON = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(users, null, 2)], { type: 'application/json' }));
    a.download = `credentials_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };
  const regenPassword = (id: number) => setUsers(prev => prev.map(u => {
    if (u.id !== id) return u;
    const password = genPassword();
    return { ...u, password, strength: calcStrength(password), aiAnalysis: undefined };
  }));
  const applyPreset = (name: string) => {
    const presets: Record<string, any> = {
      secure: { passwordLength: 20, includeSymbols: true, includeNumbers: true },
      moderate: { passwordLength: 12, includeSymbols: true, includeNumbers: true },
      basic: { passwordLength: 8, includeSymbols: false, includeNumbers: true },
    };
    setConfig(c => ({ ...c, ...presets[name] }));
    setSelectedPreset(name);
  };
  const dk = theme === 'dark';
  return (
    <div className={`min-h-screen ${dk ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50'}`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Lock className="text-white" size={22} />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Credential Manager Pro
              </h1>
            </div>
            <p className={`ml-14 text-sm ${dk ? 'text-slate-400' : 'text-slate-600'}`}>AI-powered • Groq • Enterprise-grade</p>
          </div>
          <button onClick={() => setTheme(dk ? 'light' : 'dark')}
            className={`p-3 rounded-xl transition-all ${dk ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400' : 'bg-white hover:bg-slate-100 text-slate-600 shadow'}`}>
            {dk ? '☀️' : '🌙'}
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className={`rounded-2xl p-5 border ${dk ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h2 className={`font-bold mb-3 flex items-center gap-2 ${dk ? 'text-white' : 'text-slate-900'}`}>
                <Zap size={18} className="text-purple-400" /> Quick Presets
              </h2>
              <div className="space-y-2">
                {['secure', 'moderate', 'basic'].map(p => (
                  <button key={p} onClick={() => applyPreset(p)}
                    className={`w-full px-4 py-2 rounded-lg font-medium text-sm transition-all ${selectedPreset === p ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' : dk ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={getAISuggestions} disabled={isLoadingAI}
              className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg ${isLoadingAI ? 'opacity-60 cursor-not-allowed' : ''}`}>
              {isLoadingAI ? <Loader size={18} className="animate-spin" /> : <Brain size={18} />}
              {isLoadingAI ? 'Thinking...' : 'AI Suggestions'}
            </button>
            <button onClick={() => setExpandedSettings(s => !s)}
              className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 border ${dk ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-sm'}`}>
              <Settings size={18} />
              {expandedSettings ? 'Hide Settings' : 'Show Settings'}
            </button>
          </div>
          <div className="lg:col-span-3 space-y-5">
            {showAISuggestions && aiSuggestions && (
              <div className={`rounded-2xl p-6 border ${dk ? 'bg-slate-800/50 border-purple-500/40' : 'bg-white border-purple-300 shadow-sm'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-bold text-lg flex items-center gap-2 ${dk ? 'text-white' : 'text-slate-900'}`}>
                    <Sparkles size={20} className="text-purple-400" /> AI Security Guidelines
                  </h3>
                  <button onClick={() => setShowAISuggestions(false)}
                    className={`px-3 py-1 rounded-lg text-sm ${dk ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>✕</button>
                </div>
                {aiSuggestions.securityGuidelines?.map((g: string, i: number) => (
                  <div key={i} className={`flex items-start gap-3 mb-2 ${dk ? 'text-slate-300' : 'text-slate-700'}`}>
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{g}</span>
                  </div>
                ))}
              </div>
            )}
            {expandedSettings && (
              <div className={`rounded-2xl p-6 border ${dk ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className={`font-bold text-lg mb-5 ${dk ? 'text-white' : 'text-slate-900'}`}>Configuration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${dk ? 'text-slate-300' : 'text-slate-600'}`}>Number of Users</label>
                    <div className="relative">
                      <User size={16} className={`absolute left-3 top-2.5 ${dk ? 'text-slate-500' : 'text-slate-400'}`} />
                      <input type="number" min="1" max="500" value={config.count}
                        onChange={e => setConfig(c => ({ ...c, count: Number(e.target.value) }))}
                        className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm ${dk ? 'bg-slate-700 border border-slate-600 text-white' : 'bg-slate-50 border border-slate-300 text-slate-900'} focus:outline-none`} />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${dk ? 'text-slate-300' : 'text-slate-600'}`}>Username Style</label>
                    <select value={config.usernameStyle} onChange={e => setConfig(c => ({ ...c, usernameStyle: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg text-sm ${dk ? 'bg-slate-700 border border-slate-600 text-white' : 'bg-slate-50 border border-slate-300 text-slate-900'} focus:outline-none`}>
                      <option value="professional">Professional (first.last)</option>
                      <option value="creative">Creative (word_word)</option>
                      <option value="numeric">Numeric (USER000123)</option>
                      <option value="random">Random String</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${dk ? 'text-slate-300' : 'text-slate-600'}`}>Email Domain</label>
                    <div className="relative">
                      <Mail size={16} className={`absolute left-3 top-2.5 ${dk ? 'text-slate-500' : 'text-slate-400'}`} />
                      <input type="text" value={config.emailDomain}
                        onChange={e => setConfig(c => ({ ...c, emailDomain: e.target.value }))}
                        className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm ${dk ? 'bg-slate-700 border border-slate-600 text-white' : 'bg-slate-50 border border-slate-300 text-slate-900'} focus:outline-none`} />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${dk ? 'text-slate-300' : 'text-slate-600'}`}>Department</label>
                    <select value={config.department} onChange={e => setConfig(c => ({ ...c, department: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg text-sm ${dk ? 'bg-slate-700 border border-slate-600 text-white' : 'bg-slate-50 border border-slate-300 text-slate-900'} focus:outline-none`}>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${dk ? 'text-slate-300' : 'text-slate-600'}`}>Password Length: {config.passwordLength}</label>
                    <input type="range" min="8" max="32" value={config.passwordLength}
                      onChange={e => setConfig(c => ({ ...c, passwordLength: Number(e.target.value) }))}
                      className="w-full accent-purple-500" />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${dk ? 'text-slate-300' : 'text-slate-600'}`}>Expiry (days)</label>
                    <input type="number" min="1" value={config.passwordExpiry}
                      onChange={e => setConfig(c => ({ ...c, passwordExpiry: Number(e.target.value) }))}
                      className={`w-full px-3 py-2 rounded-lg text-sm ${dk ? 'bg-slate-700 border border-slate-600 text-white' : 'bg-slate-50 border border-slate-300 text-slate-900'} focus:outline-none`} />
                  </div>
                </div>
                <div className="mb-5">
                  <label className={`block text-xs font-semibold mb-2 ${dk ? 'text-slate-300' : 'text-slate-600'}`}>Password Characters</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      {key:'includeLowercase',label:'Lowercase'},
                      {key:'includeUppercase',label:'Uppercase'},
                      {key:'includeNumbers',label:'Numbers'},
                      {key:'includeSymbols',label:'Symbols'}
                    ].map(o => (
                      <label key={o.key} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={config[o.key as keyof typeof config] as boolean}
                          onChange={e => setConfig(c => ({ ...c, [o.key]: e.target.checked }))}
                          className="accent-purple-500" />
                        <span className={`text-xs font-medium ${dk ? 'text-slate-300' : 'text-slate-700'}`}>{o.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${dk ? 'text-slate-300' : 'text-slate-600'}`}>Prefix</label>
                    <input type="text" placeholder="e.g. emp_" value={config.customPrefix}
                      onChange={e => setConfig(c => ({ ...c, customPrefix: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg text-sm ${dk ? 'bg-slate-700 border border-slate-600 text-white' : 'bg-slate-50 border border-slate-300 text-slate-900'} focus:outline-none`} />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${dk ? 'text-slate-300' : 'text-slate-600'}`}>Suffix</label>
                    <input type="text" placeholder="e.g. _2025" value={config.customSuffix}
                      onChange={e => setConfig(c => ({ ...c, customSuffix: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg text-sm ${dk ? 'bg-slate-700 border border-slate-600 text-white' : 'bg-slate-50 border border-slate-300 text-slate-900'} focus:outline-none`} />
                  </div>
                </div>
                <button onClick={generate}
                  className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2">
                  <RefreshCw size={18} /> Generate Credentials
                </button>
              </div>
            )}
            {users.length > 0 && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {label:'Generated',value:users.length,grad:true},
                    {label:'Avg Strength',value:`${Math.round(users.reduce((a,u)=>a+u.strength,0)/users.length)}/5`,green:true},
                    {label:'Department',value:config.department}
                  ].map((s,i) => (
                    <div key={i} className={`rounded-xl p-4 border ${dk ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
                      <p className={`text-xs font-medium mb-1 ${dk ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</p>
                      <p className={`text-xl font-bold ${s.grad ? 'bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent' : s.green ? 'text-green-400' : dk ? 'text-white' : 'text-slate-900'}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={copyAll} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${dk ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-sm'}`}><Copy size={15} /> Copy All</button>
                  <button onClick={downloadCSV} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${dk ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-sm'}`}><Download size={15} /> CSV</button>
                  <button onClick={downloadJSON} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${dk ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-sm'}`}><Download size={15} /> JSON</button>
                  <button onClick={() => setUsers([])} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ml-auto ${dk ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800/30' : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'}`}><Trash2 size={15} /> Clear</button>
                </div>
                <div className={`rounded-2xl border overflow-hidden ${dk ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs md:text-sm">
                      <thead className={`border-b ${dk ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                        <tr>
                          {['#','Username','Email','Password','Strength','Actions'].map(h => (
                            <th key={h} className={`px-3 md:px-5 py-3 text-left font-bold ${dk ? 'text-slate-200' : 'text-slate-700'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${dk ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
                        {users.map((user, idx) => (
                          <tr key={user.id} className={`transition-colors ${dk ? 'hover:bg-slate-700/20' : 'hover:bg-slate-50'}`}>
                            <td className={`px-3 md:px-5 py-3 font-medium ${dk ? 'text-slate-400' : 'text-slate-500'}`}>{idx + 1}</td>
                            <td className={`px-3 md:px-5 py-3 font-mono font-bold ${dk ? 'text-cyan-300' : 'text-blue-600'}`}>{user.username}</td>
                            <td className={`hidden sm:table-cell px-3 md:px-5 py-3 font-mono ${dk ? 'text-slate-300' : 'text-slate-600'}`}>{user.email}</td>
                            <td className="px-3 md:px-5 py-3">
                              <div className="flex items-center gap-1">
                                <span className={`font-mono ${dk ? 'text-slate-300' : 'text-slate-700'}`}>{showPW[user.id] ? user.password : '••••••••••'}</span>
                                <button onClick={() => setShowPW(p => ({ ...p, [user.id]: !p[user.id] }))} className={`p-1 rounded ${dk ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                                  {showPW[user.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                              </div>
                            </td>
                            <td className="px-3 md:px-5 py-3">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: strengthColor(user.strength) }} />
                                <span className="hidden md:inline text-xs font-medium" style={{ color: strengthColor(user.strength) }}>{strengthLabel(user.strength)}</span>
                              </div>
                            </td>
                            <td className="px-3 md:px-5 py-3">
                              <div className="flex items-center gap-1">
                                <button onClick={() => copyOne(user)} className={`p-1.5 rounded-lg transition-all ${user.copied ? 'bg-green-500/20 text-green-400' : dk ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                                  {user.copied ? <CheckCircle size={13} /> : <Copy size={13} />}
                                </button>
                                <button onClick={() => regenPassword(user.id)} className={`p-1.5 rounded-lg transition-all ${dk ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}><RefreshCw size={13} /></button>
                                <button onClick={() => analyzeWithAI(user)} disabled={isLoadingAI} className={`p-1.5 rounded-lg transition-all ${dk ? 'bg-slate-700 hover:bg-slate-600 text-purple-400' : 'bg-slate-100 hover:bg-slate-200 text-purple-600'} ${isLoadingAI ? 'opacity-50 cursor-not-allowed' : ''}`}><Brain size={13} /></button>
                                <button onClick={() => setUsers(prev => prev.filter(u => u.id !== user.id))} className={`p-1.5 rounded-lg transition-all ${dk ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-500'}`}><Trash2 size={13} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {users.some(u => u.aiAnalysis) && (
                  <div className={`rounded-2xl p-5 border ${dk ? 'bg-slate-800/50 border-purple-500/30' : 'bg-white border-purple-200 shadow-sm'}`}>
                    <h3 className={`font-bold text-base mb-4 flex items-center gap-2 ${dk ? 'text-white' : 'text-slate-900'}`}><Brain size={18} className="text-purple-400" /> AI Security Analysis</h3>
                    {users.filter(u => u.aiAnalysis).map(user => (
                      <div key={user.id} className={`mb-3 p-4 rounded-xl border ${dk ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-mono font-bold text-sm ${dk ? 'text-cyan-300' : 'text-blue-600'}`}>{user.username}</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${user.aiAnalysis?.riskLevel === 'low' ? 'bg-green-500/20 text-green-400' : user.aiAnalysis?.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{user.aiAnalysis?.riskLevel?.toUpperCase()} RISK</span>
                        </div>
                        <p className={`text-xs mb-2 ${dk ? 'text-slate-400' : 'text-slate-600'}`}>{user.aiAnalysis?.summary}</p>
                        <div className="space-y-1">
                          {user.aiAnalysis?.recommendations?.map((r, i) => (
                            <div key={i} className={`flex items-start gap-2 text-xs ${dk ? 'text-slate-300' : 'text-slate-700'}`}>
                              <CheckCircle size={12} className="text-green-400 mt-0.5 flex-shrink-0" />{r}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            {users.length === 0 && !expandedSettings && (
              <div className={`rounded-2xl p-16 text-center border ${dk ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
                <Shield size={44} className="mx-auto mb-4 text-slate-500 opacity-40" />
                <p className={`font-medium ${dk ? 'text-slate-400' : 'text-slate-500'}`}>Open Settings to configure and generate credentials</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// deploy
