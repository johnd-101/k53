'use client';
import { useState, useEffect } from 'react';

type Category = 'Controls' | 'Rules' | 'Signs' | 'All';
type Q = { id: number; questionText: string; optionA: string; optionB: string; optionC: string; correctAnswer: 'A'|'B'|'C'; category: Category; explanation?: string; imageData?: string; };

export default function Page() {
  const [questions, setQuestions] = useState<Q[]>([]);
  const [tab, setTab] = useState<'dashboard'|'manage'|'test'|'learn'>('dashboard');
  const [filter, setFilter] = useState<Category>('All');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Q|null>(null);
  const [showModal, setShowModal] = useState(false);
  const [health, setHealth] = useState<any>(null);
  const [testQs, setTestQs] = useState<Q[]>([]);
  const [testIdx, setTestIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number,string>>({});
  const [showResult, setShowResult] = useState(false);
  const [form, setForm] = useState<any>({ questionText:'', optionA:'', optionB:'', optionC:'', correctAnswer:'A', category:'Rules', explanation:'', imageData:'' });
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [resizing, setResizing] = useState(false);

  // AUTO RESIZE FUNCTION - Resizes any uploaded sign to max 400x400, JPEG 80%
  const resizeImage = (base64: string, maxWidth = 400, maxHeight = 400, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        let { width, height } = img;
        
        // If SVG or small image, keep as is if under max
        if (base64.startsWith('data:image/svg+xml') && width <= maxWidth && height <= maxHeight) {
          resolve(base64);
          return;
        }

        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject('No canvas context');
          return;
        }

        // White background for JPEG (better compression for signs)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG with compression
        const resized = canvas.toDataURL('image/jpeg', quality);
        console.log(`Resized: ${base64.length} chars -> ${resized.length} chars (${Math.round(resized.length/base64.length*100)}%)`);
        resolve(resized);
      };
      img.onerror = () => reject('Failed to load image');
    });
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setResizing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        // Auto resize to 400x400
        const resized = await resizeImage(base64, 400, 400, 0.8);
        setForm((prev: any) => ({ ...prev, imageData: resized }));
        setResizing(false);
      };
      reader.onerror = () => {
        setResizing(false);
        alert('Failed to read image');
      };
      reader.readAsDataURL(file);
    } catch (e) {
      setResizing(false);
      console.error(e);
      alert('Failed to resize image');
    }
  };

  const fetchQs = async () => {
    try {
      const res = await fetch(`/api/questions?category=${filter !== 'All' ? filter : ''}&search=${search}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setQuestions(data);
        setErrorMsg('');
      } else {
        console.error('API returned non-array:', data);
        setQuestions([]);
        setErrorMsg(data.error || data.message || 'Failed to load questions. Check DB.');
      }
    } catch (e: any) {
      console.error(e);
      setQuestions([]);
      setErrorMsg('Failed to fetch: ' + e.message);
    }
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const d = await res.json();
      setHealth(d);
    } catch (e) {
      setHealth({ connected: false, error: 'Cannot connect' });
    }
  };

  useEffect(()=>{ fetchQs(); fetchHealth(); }, [filter]);

  const openAdd = () => { setEditing(null); setForm({ questionText:'', optionA:'', optionB:'', optionC:'', correctAnswer:'A', category:'Rules', explanation:'', imageData:'' }); setShowModal(true); };
  const openEdit = (q:Q) => { setEditing(q); setForm(q); setShowModal(true); };

  const save = async () => {
    const payload = { ...form };
    if (editing) await fetch(`/api/questions/${editing.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    else await fetch('/api/questions', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    setShowModal(false); fetchQs(); fetchHealth();
  };

  const del = async (id:number) => { if(!confirm('Delete?')) return; await fetch(`/api/questions/${id}`, { method:'DELETE' }); fetchQs(); };

  const startTest = () => {
    const safeQs = Array.isArray(questions) ? questions : [];
    const shuffled = [...safeQs].sort(()=>0.5-Math.random());
    const controls = shuffled.filter(q=>q.category==='Controls').slice(0,8);
    const rest = shuffled.filter(q=>q.category!=='Controls').slice(0,22);
    let final = [...controls, ...rest]; if(final.length<30) final = shuffled.slice(0,30);
    setTestQs(final); setTestIdx(0); setAnswers({}); setShowResult(false); setTab('test');
  };

  const score = () => {
    let correct=0; testQs.forEach(q=>{ if(answers[q.id]===q.correctAnswer) correct++; });
    return { correct, total:testQs.length, passed: correct>=22 };
  };

  const safeQuestions = Array.isArray(questions) ? questions : [];
  const controlsCount = safeQuestions.filter(q=>q.category==='Controls').length;
  const othersCount = safeQuestions.filter(q=>q.category!=='Controls').length;

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="font-bold text-xl">SA Learner K53 <span className="text-green-600">+ Auto Resize</span></h1>
          <div className={`text-xs px-3 py-1 rounded-full ${health?.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {health?.connected ? `Connected ${health.count} Qs, ${health.withImages || 0} images` : 'Offline'}
          </div>
        </div>
      </header>

      <nav className="max-w-6xl mx-auto px-4 py-3 flex gap-2">
        {(['dashboard','manage','test','learn'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 rounded-lg capitalize ${tab===t?'bg-black text-white':'bg-white border'}`}>{t}</button>
        ))}
      </nav>

      <main className="max-w-6xl mx-auto px-4 pb-20">
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl mb-4">
            <div className="font-bold">DB Error: {errorMsg}</div>
          </div>
        )}

        {tab==='dashboard' && (
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border"><div className="text-sm text-gray-500">Total</div><div className="text-2xl font-bold">{safeQuestions.length}</div></div>
              <div className="bg-white p-4 rounded-xl border"><div className="text-sm text-gray-500">Controls</div><div className="text-2xl font-bold">{controlsCount} / 8 needed</div></div>
              <div className="bg-white p-4 rounded-xl border"><div className="text-sm text-gray-500">Rules and Signs</div><div className="text-2xl font-bold">{othersCount} / 22 needed</div></div>
            </div>
            <div className="bg-white p-6 rounded-xl border">
              <h2 className="font-bold mb-3">Quick Actions</h2>
              <p className="text-sm text-gray-500 mb-3">Road sign images auto-resize to 400x400 JPEG 80% on upload to save DB space.</p>
              <div className="flex gap-2">
                <button onClick={startTest} disabled={safeQuestions.length===0} className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-300">Start 30Q Test</button>
                <button onClick={()=>{fetchQs(); fetchHealth();}} className="bg-white border px-4 py-2 rounded-lg">Retry DB</button>
              </div>
            </div>
          </div>
        )}

        {tab==='manage' && (
          <div className="bg-white rounded-xl border p-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <select value={filter} onChange={e=>setFilter(e.target.value as any)} className="border rounded-lg px-3 py-2"><option>All</option><option>Controls</option><option>Rules</option><option>Signs</option></select>
              <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&fetchQs()} placeholder="Search..." className="border rounded-lg px-3 py-2 flex-1" />
              <button onClick={fetchQs} className="border px-3 py-2 rounded-lg">Search</button>
              <button onClick={openAdd} className="bg-black text-white px-4 py-2 rounded-lg">Add Question</button>
            </div>
            <div className="space-y-2">
              {safeQuestions.map(q=>(
                <div key={q.id} className="border rounded-lg p-3 flex gap-3">
                  {q.imageData && <img src={q.imageData} className="w-16 h-16 object-contain rounded border bg-white" alt="sign" />}
                  <div className="flex-1"><div className="font-medium">{q.questionText}</div><div className="text-xs text-gray-500">{q.category} - {q.correctAnswer} - {q.optionA} / {q.optionB} / {q.optionC} {q.imageData && <span className="ml-2">📷 {Math.round(q.imageData.length/1024)}KB</span>}</div></div>
                  <div className="flex gap-1"><button onClick={()=>openEdit(q)} className="px-2 py-1 border rounded">Edit</button><button onClick={()=>del(q.id)} className="px-2 py-1 border rounded text-red-600">Del</button></div>
                </div>
              ))}
              {safeQuestions.length===0 && <div className="text-center text-gray-500 py-10">No questions. Create DB then seed.</div>}
            </div>
          </div>
        )}

        {tab==='test' && (
          <div className="bg-white rounded-xl border p-6">
            {testQs.length===0 ? (
              <div>No test loaded. Go to Dashboard and click Start Test. {safeQuestions.length} questions loaded.</div>
            ) : !showResult ? (
              <div>
                <div className="text-sm text-gray-500 mb-2">Question {testIdx+1} of {testQs.length}</div>
                <div className="font-bold text-lg mb-2">{testQs[testIdx].questionText}</div>
                {testQs[testIdx].imageData && <img src={testQs[testIdx].imageData} className="w-80 h-60 object-contain border rounded mb-3 bg-white p-2" alt="road sign" />}
                {(['A','B','C'] as const).map(opt=>(
                  <label key={opt} className={`block border rounded-lg p-3 mb-2 cursor-pointer ${answers[testQs[testIdx].id]===opt?'bg-black text-white':''}`}>
                    <input type="radio" name="ans" className="hidden" checked={answers[testQs[testIdx].id]===opt} onChange={()=>setAnswers({...answers, [testQs[testIdx].id]:opt})} />
                    {opt}. {(testQs[testIdx] as any)[`option${opt}`]}
                  </label>
                ))}
                <div className="flex gap-2 mt-4">
                  <button disabled={testIdx===0} onClick={()=>setTestIdx(testIdx-1)} className="border px-4 py-2 rounded-lg">Prev</button>
                  {testIdx < testQs.length-1 ? <button onClick={()=>setTestIdx(testIdx+1)} className="bg-black text-white px-4 py-2 rounded-lg">Next</button> : <button onClick={()=>setShowResult(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg">Submit</button>}
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-2">{score().passed ? 'Passed' : 'Failed'}</h2>
                <p>Score {score().correct} / {score().total} - Need 22 to pass</p>
                <div className="mt-4 space-y-2">{testQs.map(q=><div key={q.id} className={`p-2 rounded border ${answers[q.id]===q.correctAnswer?'bg-green-50':'bg-red-50'}`}><div className="flex gap-2">{q.imageData && <img src={q.imageData} className="w-12 h-12 object-contain border rounded bg-white" alt="sign" />}<div>{q.questionText} - Your: {answers[q.id]} Correct: {q.correctAnswer} {q.explanation && <span className="text-xs text-gray-500">- {q.explanation}</span>}</div></div></div>)}</div>
              </div>
            )}
          </div>
        )}

        {tab==='learn' && (
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-bold">K53 Quick Ref</h2>
            <ul className="list-disc pl-5">
              <li>Urban 60, rural 100, freeway 120 km/h</li>
              <li>Alcohol: 0.05 percent normal, 0.02 percent professional</li>
              <li>Following: 2 sec, 3 plus in rain</li>
              <li>Stop equals complete stop, Yield equals give way</li>
            </ul>
            <p className="text-sm text-gray-500 mt-4">Sign images auto-resize to 400x400 JPEG 80% on upload. SVGs under 400px kept as SVG.</p>
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-auto">
            <h3 className="font-bold mb-3">{editing?'Edit':'Add'} Question</h3>
            <div className="space-y-3">
              <textarea value={form.questionText} onChange={e=>setForm({...form, questionText:e.target.value})} placeholder="Question" className="w-full border rounded-lg p-2" />
              <div className="grid grid-cols-3 gap-2"><input value={form.optionA} onChange={e=>setForm({...form, optionA:e.target.value})} placeholder="Option A" className="border rounded p-2" /><input value={form.optionB} onChange={e=>setForm({...form, optionB:e.target.value})} placeholder="Option B" className="border rounded p-2" /><input value={form.optionC} onChange={e=>setForm({...form, optionC:e.target.value})} placeholder="Option C" className="border rounded p-2" /></div>
              <select value={form.correctAnswer} onChange={e=>setForm({...form, correctAnswer:e.target.value})} className="border rounded p-2 w-full"><option>A</option><option>B</option><option>C</option></select>
              <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} className="border rounded p-2 w-full"><option>Controls</option><option>Rules</option><option>Signs</option></select>
              <input value={form.explanation} onChange={e=>setForm({...form, explanation:e.target.value})} placeholder="Explanation" className="border rounded p-2 w-full" />
              <div>
                <label className="text-sm font-medium">Road Sign Image (auto-resizes to 400x400)</label>
                <input type="file" accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f) handleImageUpload(f); }} className="w-full border rounded p-2 mt-1" />
                {resizing && <div className="text-sm text-blue-600 mt-2">Resizing image...</div>}
                {form.imageData && (
                  <div className="mt-2">
                    <img src={form.imageData} className="w-40 h-40 object-contain border rounded bg-white p-2" alt="preview" />
                    <div className="text-xs text-gray-500 mt-1">Size: {Math.round(form.imageData.length/1024)}KB (auto-resized)</div>
                    <button onClick={()=>setForm({...form, imageData:''})} className="text-xs text-red-600 mt-1">Remove image</button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-4"><button onClick={save} disabled={resizing} className="bg-black text-white px-4 py-2 rounded-lg disabled:bg-gray-300">{resizing ? 'Resizing...' : 'Save to Postgres'}</button><button onClick={()=>setShowModal(false)} className="border px-4 py-2 rounded-lg">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
