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

  const fetchQs = async () => {
    const res = await fetch(`/api/questions?category=${filter !== 'All' ? filter : ''}&search=${search}`);
    const data = await res.json(); setQuestions(data);
  };
  const fetchHealth = async () => {
    const res = await fetch('/api/health'); const d = await res.json(); setHealth(d);
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
    const shuffled = [...questions].sort(()=>0.5-Math.random());
    const controls = shuffled.filter(q=>q.category==='Controls').slice(0,8);
    const rest = shuffled.filter(q=>q.category!=='Controls').slice(0,22);
    let final = [...controls, ...rest]; if(final.length<30) final = shuffled.slice(0,30);
    setTestQs(final); setTestIdx(0); setAnswers({}); setShowResult(false); setTab('test');
  };

  const score = () => {
    let correct=0; testQs.forEach(q=>{ if(answers[q.id]===q.correctAnswer) correct++; });
    return { correct, total:testQs.length, passed: correct>=22 };
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="font-bold text-xl">🇿🇦 SA Learner K53 <span className="text-green-600">Next.js + Prisma</span></h1>
          <div className={`text-xs px-3 py-1 rounded-full ${health?.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {health?.connected ? `● Postgres Connected • ${health.count} Qs` : '● Offline'}
          </div>
        </div>
      </header>

      <nav className="max-w-6xl mx-auto px-4 py-3 flex gap-2">
        {(['dashboard','manage','test','learn'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 rounded-lg capitalize ${tab===t?'bg-black text-white':'bg-white border'}`}>{t}</button>
        ))}
      </nav>

      <main className="max-w-6xl mx-auto px-4 pb-20">
        {tab==='dashboard' && (
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border"><div className="text-sm text-gray-500">Total</div><div className="text-2xl font-bold">{questions.length}</div></div>
              <div className="bg-white p-4 rounded-xl border"><div className="text-sm text-gray-500">Controls</div><div className="text-2xl font-bold">{questions.filter(q=>q.category==='Controls').length}/8 needed</div></div>
              <div className="bg-white p-4 rounded-xl border"><div className="text-sm text-gray-500">Rules+Signs</div><div className="text-2xl font-bold">{questions.filter(q=>q.category!=='Controls').length}/22 needed</div></div>
            </div>
            <div className="bg-white p-6 rounded-xl border">
              <h2 className="font-bold mb-3">Quick Actions</h2>
              <div className="flex gap-2">
                <button onClick={startTest} className="bg-green-600 text-white px-4 py-2 rounded-lg">Start 30Q Test</button>
                <button onClick={async()=>{ await fetch('/api/seed',{method:'POST'}); fetchQs(); fetchHealth(); }} className="bg-white border px-4 py-2 rounded-lg">Seed Sample Data</button>
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
              <button onClick={openAdd} className="bg-black text-white px-4 py-2 rounded-lg">+ Add Question</button>
            </div>
            <div className="space-y-2">
              {questions.map(q=>(
                <div key={q.id} className="border rounded-lg p-3 flex gap-3">
                  {q.imageData && <img src={q.imageData} className="w-16 h-16 object-cover rounded" />}
                  <div className="flex-1"><div className="font-medium">{q.questionText}</div><div className="text-xs text-gray-500">{q.category} • {q.correctAnswer} • {q.optionA} / {q.optionB} / {q.optionC}</div></div>
                  <div className="flex gap-1"><button onClick={()=>openEdit(q)} className="px-2 py-1 border rounded">Edit</button><button onClick={()=>del(q.id)} className="px-2 py-1 border rounded text-red-600">Del</button></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='test' && (
          <div className="bg-white rounded-xl border p-6">
            {testQs.length===0 ? <div>No test loaded. Go to Dashboard > Start Test. Loaded {questions.length} questions from Postgres.</div> : !showResult ? (
              <div>
                <div className="text-sm text-gray-500 mb-2">Q {testIdx+1}/{testQs.length}</div>
                <div className="font-bold text-lg mb-2">{testQs[testIdx].questionText}</div>
                {testQs[testIdx].imageData && <img src={testQs[testIdx].imageData} className="w-64 h-40 object-contain border rounded mb-3" />}
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
                <h2 className="text-2xl font-bold mb-2">{score().passed ? '✅ Passed!' : '❌ Failed'}</h2>
                <p>Score {score().correct}/{score().total} (Need 22 to pass)</p>
                <div className="mt-4 space-y-2">{testQs.map(q=><div key={q.id} className={`p-2 rounded border ${answers[q.id]===q.correctAnswer?'bg-green-50':'bg-red-50'}`}>{q.questionText} — Your: {answers[q.id]} Correct: {q.correctAnswer} {q.explanation && <span className="text-xs text-gray-500">— {q.explanation}</span>}</div>)}</div>
              </div>
            )}
          </div>
        )}

        {tab==='learn' && (
          <div className="bg-white rounded-xl border p-6 prose">
            <h2 className="font-bold">K53 Quick Ref</h2>
            <ul><li>Urban 60, rural 100, freeway 120 km/h</li><li>Alcohol: 0.05% normal, 0.02% professional</li><li>Following: 2 sec, 3+ in rain</li><li>Stop = complete stop, Yield = give way</li></ul>
            <p className="text-sm text-gray-500 mt-4">All data from Postgres via Prisma. Images stored as base64 in imageData field. For production use S3.</p>
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
                <label className="text-sm">Sign Image (upload)</label>
                <input type="file" accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>setForm({...form, imageData:r.result as string}); r.readAsDataURL(f); }} className="w-full border rounded p-2" />
                {form.imageData && <img src={form.imageData} className="mt-2 w-32 h-32 object-contain border rounded" />}
              </div>
            </div>
            <div className="flex gap-2 mt-4"><button onClick={save} className="bg-black text-white px-4 py-2 rounded-lg">Save to Postgres</button><button onClick={()=>setShowModal(false)} className="border px-4 py-2 rounded-lg">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
