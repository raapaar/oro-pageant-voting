'use client';
import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowLeft, Save, Upload, Download, Plus, ShieldCheck, Check, Loader2 } from 'lucide-react';
import { defaultEvent, eventSchema, type EventData } from '../../lib/event';
import { Butterfly } from '../pageant-app';
export default function Studio() {
    const [data, setData] = useState<EventData>(defaultEvent), [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [signedIn, setSignedIn] = useState(false), [loaded, setLoaded] = useState(false), [dirty, setDirty] = useState(false);
    useEffect(() => { fetch('/api/event?draft=1').then(async (r) => { const j = await r.json() as {
        event: EventData;
        signedIn: boolean;
        error?: string;
    }; if (!r.ok)
        throw Error(j.error); setData(j.event); setSignedIn(j.signedIn); setLoaded(true); }).catch(() => setMessage('Could not load your saved draft. Refresh before editing.')); }, []);
    useEffect(() => { if (!dirty)
        return; const guard = (e: BeforeUnloadEvent) => e.preventDefault(); window.addEventListener('beforeunload', guard); return () => window.removeEventListener('beforeunload', guard); }, [dirty]);
    function edit(key: keyof EventData, value: string) { setData(d => ({ ...d, [key]: value })); setDirty(true); }
    function editContestant(i: number, key: string, value: string) { setData(d => ({ ...d, contestants: d.contestants.map((c, n) => i === n ? { ...c, [key]: value } : c) })); setDirty(true); }
    async function save() { const parsed = eventSchema.safeParse(data); if (!parsed.success) {
        setMessage(parsed.error.issues[0]?.message || 'Please check all fields.');
        return;
    } setBusy(true); try {
        const r = await fetch('/api/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const j = await r.json() as {
            message: string;
            error?: string;
        };
        if (!r.ok)
            throw Error(j.error);
        setMessage(j.message);
        setDirty(false);
    }
    catch (e) {
        setMessage(e instanceof Error ? e.message : 'Unable to save.');
    }
    finally {
        setBusy(false);
    } }
    function download() { const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'oro-pageant-event-draft.json'; a.click(); URL.revokeObjectURL(a.href); setMessage('Event draft exported. Keep this file to import your event later.'); }
    async function upload(file: File | undefined) { if (!file)
        return; if (file.size > 65000) {
        setMessage('Please use a JSON file smaller than 65 KB.');
        return;
    } try {
        const parsed = eventSchema.safeParse(JSON.parse(await file.text()));
        if (!parsed.success)
            throw Error(parsed.error.issues[0]?.message || 'Invalid event file');
        setData(parsed.data);
        setDirty(true);
        setMessage('File imported into the editor. Save your draft to preview it.');
    }
    catch (e) {
        setMessage(e instanceof Error ? e.message : 'Please use the exported JSON format.');
    } }
    return <><div className="preview-banner"><span className="status-dot"/>ORGANISER WORKSPACE<span className="banner-divider">/</span><span>Private drafts · Official voting closed</span></div><header className="header"><a className="brand" href="/"><Butterfly /><span>ORO<span className="brand-year">{data.year}</span></span></a><a href="/admin" className="text-link"><ArrowLeft size={15}/>Admin dashboard</a></header><main className="studio-main"><div className="studio-top"><div><div className="eyebrow">BEHIND THE JOURNEY</div><h1>Your event studio.</h1><p>Build the lineup. Tell their stories. Get ready for Oro.</p></div><a className="button" href="/?preview=draft">Preview saved draft <ArrowUpRight size={16}/></a></div><div className="studio-notice"><ShieldCheck size={20}/><p><strong>A space to prepare, before the spotlight.</strong><br />Your draft is private until you publish it from the admin dashboard. Publishing starts a fresh public practice round. Official voting remains closed until the event rules are confirmed.</p></div><div className="studio-grid"><div><section className="studio-panel"><h2>The event</h2><div className="form-grid"><label className="field">Event title<input value={data.title} maxLength={100} onChange={e => edit('title', e.target.value)}/></label><label className="field">Year<input value={data.year} pattern="20[0-9]{2}" maxLength={4} onChange={e => edit('year', e.target.value)}/></label><label className="field full">Introduction<textarea value={data.description} maxLength={600} onChange={e => edit('description', e.target.value)}/></label><label className="field">Event date<input value={data.date} maxLength={80} onChange={e => edit('date', e.target.value)}/></label><label className="field">Venue<input value={data.venue} maxLength={120} onChange={e => edit('venue', e.target.value)}/></label></div></section><section className="studio-panel"><h2>The contestants <span style={{ color: '#9ca58e' }}>/{String(data.contestants.length).padStart(2, '0')}</span></h2>{data.contestants.map((c, i) => <div className="studio-contestant" key={i}><div className="studio-contestant-heading"><span>CONTESTANT {String(i + 1).padStart(2, '0')}</span><button className="remove" disabled={data.contestants.length <= 1} onClick={() => { if (confirm(`Remove ${c.name} from this draft?`)) {
        setData(d => ({ ...d, contestants: d.contestants.filter((_, n) => n !== i) }));
        setDirty(true);
    } }}>Remove</button></div><div className="form-grid"><label className="field">Name<input value={c.name} maxLength={80} onChange={e => editContestant(i, 'name', e.target.value)}/></label><label className="field">District<select value={c.district} onChange={e => editContestant(i, 'district', e.target.value)}><option>Ijivitari</option><option>Sohe</option></select></label><label className="field">Contestant ID<input value={c.id} maxLength={40} onChange={e => editContestant(i, 'id', e.target.value)}/><small>Unique lowercase letters, numbers and hyphens.</small></label><label className="field">Community<input value={c.community} maxLength={100} onChange={e => editContestant(i, 'community', e.target.value)}/></label><label className="field full">Story & advocacy<textarea value={c.bio} maxLength={600} onChange={e => editContestant(i, 'bio', e.target.value)}/></label><label className="field full">Portrait URL<input type="url" value={c.image} placeholder="https://… (optional)" maxLength={1000} onChange={e => editContestant(i, 'image', e.target.value)}/><small>Use an HTTPS image you have permission to publish. Leave blank for the placeholder.</small></label></div></div>)}<button className="button" style={{ marginTop: 25 }} disabled={data.contestants.length >= 30} onClick={() => { setData(d => ({ ...d, contestants: [...d.contestants, { id: `contestant-${crypto.randomUUID().slice(0, 8)}`, name: `Contestant ${String(d.contestants.length + 1).padStart(2, '0')}`, district: 'Ijivitari', community: '', bio: '', image: '' }] })); setDirty(true); }}><Plus size={16}/>Add contestant</button></section></div><aside className="studio-sidebar"><div className="studio-panel"><div className="eyebrow">DRAFT CONTROLS</div><h3 style={{ marginTop: 17 }}>Ready when you are.</h3><p>Save your event details now, or import the completed event file later. Changes appear in your private pageant preview.</p><div className="studio-actions">{signedIn ? <button className="button primary" disabled={busy || !loaded} onClick={save}>{busy ? <Loader2 size={16} className="spin"/> : <Save size={16}/>}Save private draft</button> : <a className="button primary" target="_top" href="/signin-with-chatgpt?return_to=%2Fstudio">Sign in to save <ArrowUpRight size={14}/></a>}<button className="button" onClick={download}><Download size={15}/>Export JSON</button><label className="button file-label"><Upload size={15}/>Import JSON<input type="file" accept="application/json,.json" onChange={e => { upload(e.target.files?.[0]); e.target.value = ''; }}/></label></div>{dirty && <p style={{ marginTop: 12, fontSize: 10 }}>● You have unsaved changes.</p>}{message && <div role="status" className="studio-message">{message}</div>}</div><div className="studio-panel"><h3>Before the official opening</h3><ul className="checklist"><li><Check size={14}/>Confirm event name & dates</li><li><Check size={14}/>Add approved contestant data</li><li><Check size={14}/>Choose free or paid voting</li><li><Check size={14}/>Set eligibility & vote limits</li><li><Check size={14}/>Configure voter verification</li><li><Check size={14}/>Approve & publish public site</li></ul></div></aside></div></main></>;
}
