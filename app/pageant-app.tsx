'use client';
import { useEffect, useState, useRef } from 'react';
import { ArrowUpRight, ArrowRight, Check, ChevronDown, Search, X, Heart, ShieldCheck, Menu, MapPin, CalendarDays, Share2, CheckCircle2, Loader2, Crown } from 'lucide-react';
import Leaderboard from './leaderboard/leaderboard-client';
import { defaultEvent, type EventData } from '../lib/event';
type Contestant = EventData['contestants'][number];
type EventResponse = {
    event: EventData;
    counts: {
        id: string;
        count: number;
    }[];
    ballot: Ballot | null;
    signedIn: boolean;
    custom: boolean;
    error?: string;
};
type Ballot = {
    contestantId: string;
    id: string;
};
export function Butterfly({ className = '' }: {
    className?: string;
}) { return <svg className={className} viewBox="0 0 520 540" fill="none" aria-hidden="true"><defs><linearGradient id="wing" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#b6cc7b"/><stop offset=".5" stopColor="#d2b76b"/><stop offset="1" stopColor="#8d9c53"/></linearGradient></defs><g stroke="#132f28" strokeWidth="6" strokeLinejoin="round"><path d="M256 275C213 160 88 43 30 58C-15 109 61 244 227 295C140 276 75 307 84 358C111 441 224 424 256 307Z" fill="url(#wing)"/><path d="M265 275C308 160 433 43 491 58C536 109 460 244 294 295C381 276 446 307 437 358C410 441 297 424 265 307Z" fill="url(#wing)"/><g strokeWidth="13"><path d="M248 277L60 89M241 282L67 139M239 287L95 205M247 299L115 361M249 306L175 396M274 277L461 89M280 282L454 139M282 287L426 205M275 299L406 361M272 306L346 396"/></g><path d="M257 267Q250 239 229 225M265 267Q273 240 293 225" strokeWidth="3"/><path d="M261 267Q247 310 261 349Q276 309 261 267Z" fill="#112e28"/></g><g fill="#d8c98c"><ellipse cx="76" cy="112" rx="9" ry="22" transform="rotate(-43 76 112)"/><ellipse cx="119" cy="153" rx="8" ry="24" transform="rotate(-43 119 153)"/><ellipse cx="166" cy="202" rx="7" ry="24" transform="rotate(-43 166 202)"/><ellipse cx="444" cy="112" rx="9" ry="22" transform="rotate(43 444 112)"/><ellipse cx="401" cy="153" rx="8" ry="24" transform="rotate(43 401 153)"/><ellipse cx="354" cy="202" rx="7" ry="24" transform="rotate(43 354 202)"/></g></svg>; }
export function Portrait({ index, image, name }: {
    index: number;
    image: string;
    name: string;
}) { return <div className={`portrait tone-${index % 4}`}>{image ? <img src={image} alt={name} loading="lazy" onError={e => { e.currentTarget.style.display = 'none'; }}/> : <><div className="portrait-grain"/><svg viewBox="0 0 320 400" aria-hidden="true"><g fill="currentColor"><path d="M110 152C88 120 102 65 156 63C211 60 235 111 208 157L200 194H118Z"/><ellipse cx="160" cy="143" rx="42" ry="59"/><path d="M140 186L180 186L188 235Q253 244 275 400H44Q57 252 132 235Z"/></g><path d="M103 255Q160 296 219 255" stroke="currentColor" fill="none" strokeWidth="3" opacity=".4"/></svg><span className="photo-placeholder">OFFICIAL PORTRAIT TO COME</span></>}<span className="portrait-number">{String(index + 1).padStart(2, '0')}</span></div>; }
export default function PageantApp() {
    const [event, setEvent] = useState<EventData>(defaultEvent), [counts, setCounts] = useState<Record<string, number>>({}), [ballot, setBallot] = useState<Ballot | null>(null), [signedIn, setSignedIn] = useState(false), [custom, setCustom] = useState(false), [loading, setLoading] = useState(true), [error, setError] = useState('');
    const [tab, setTab] = useState('All contestants'), [search, setSearch] = useState(''), [selected, setSelected] = useState<Contestant | null>(null), [step, setStep] = useState<'profile' | 'confirm' | 'success'>('profile'), [busy, setBusy] = useState(false), [receipt, setReceipt] = useState(''), [menu, setMenu] = useState(false), [notice, setNotice] = useState('');
    const dialog = useRef<HTMLDialogElement>(null);
    const hashOpened = useRef(false);
    async function load() { setLoading(true); try {
        const res = await fetch('/api/event' + (new URLSearchParams(location.search).get('preview') === 'draft' ? '?draft=1' : ''));
        const data = await res.json() as EventResponse;
        if (!res.ok)
            throw Error(data.error);
        setEvent(data.event);
        setCounts(Object.fromEntries(data.counts.map((v: {
            id: string;
            count: number;
        }) => [v.id, v.count])));
        setBallot(data.ballot);
        setSignedIn(data.signedIn);
        setCustom(data.custom);
        setError('');
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to load event');
    }
    finally {
        setLoading(false);
    } }
    useEffect(() => { load(); }, []);
    useEffect(() => { if (selected)
        dialog.current?.showModal();
    else
        dialog.current?.close(); }, [selected]);
    useEffect(() => { if (!notice)
        return; const t = setTimeout(() => setNotice(''), 4000); return () => clearTimeout(t); }, [notice]);
    function open(c: Contestant) { setSelected(c); setStep('profile'); setNotice(''); }
    async function vote() { setBusy(true); try {
        const res = await fetch('/api/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contestantId: selected?.id, mode: 'practice', draft: new URLSearchParams(location.search).get('preview') === 'draft' }) });
        const data = await res.json() as {
            error?: string;
            receipt: string;
        };
        if (!res.ok)
            throw Error(data.error);
        setReceipt(data.receipt);
        setStep('success');
        await load();
    }
    catch (e) {
        setNotice(e instanceof Error ? e.message : 'Please try again');
    }
    finally {
        setBusy(false);
    } }
    async function share(c?: Contestant) { const url = new URL(location.origin); if (c)
        url.hash = `${c.id}`; try {
        if (navigator.share)
            await navigator.share({ title: event.title, text: c ? `Discover ${c.name} at ${event.title}` : 'Celebrate the spirit of Oro.', url: url.href });
        else {
            await navigator.clipboard.writeText(url.href);
            setNotice('Link copied. Ready to share.');
        }
    }
    catch {
        setNotice('Sharing cancelled. You can copy the address from your browser.');
    } }
    useEffect(() => { if (!loading && !hashOpened.current && location.hash) {
        hashOpened.current = true;
        const c = event.contestants.find(c => `#${c.id}` === location.hash);
        if (c) {
            setSelected(c);
            setStep('profile');
        }
    } }, [loading, event]);
    const filtered = event.contestants.filter(c => (tab === 'All contestants' || c.district === tab) && `${c.name} ${c.district} ${c.community}`.toLowerCase().includes(search.toLowerCase()));
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return <>
 <div className="preview-banner"><span className="status-dot"/>{custom ? 'YOUR PRIVATE EVENT PREVIEW' : 'A FIRST LOOK · EVENT PREVIEW'}<span className="banner-divider">/</span><span>Official voting opens soon</span><a href="/admin">Admin login <ArrowUpRight size={13}/></a></div>
 <header className="header"><a href="/" className="brand"><Butterfly /><span>ORO<span className="brand-year">{event.year}</span></span></a><nav className={menu ? 'nav open' : 'nav'}><a href="#contestants" onClick={() => setMenu(false)}>The contestants</a><a href="#how-it-works" onClick={() => setMenu(false)}>How to vote</a><a href="/leaderboard">Leaderboard</a><a href="#our-story" onClick={() => setMenu(false)}>Our story</a></nav><a className="header-cta" href="#contestants">Find your favourite <ArrowUpRight size={16}/></a><button className="menu-button icon-button" aria-label="Toggle navigation" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button></header>
 <main>
 <section className="hero"><div className="hero-copy"><div className="eyebrow"><span />ORO PROVINCE, PAPUA NEW GUINEA</div><h1>Her story.<br /><em>Your voice.</em></h1><p>{event.description}</p><div className="hero-actions"><a className="button primary" href="#contestants">Meet the contestants <ArrowUpRight size={18}/></a><a className="text-link" href="#how-it-works">How it works <ArrowRight size={16}/></a></div><div className="hero-footnote"><ShieldCheck size={17}/><span>A celebration of culture, confidence & community.</span></div></div>
 <div className="hero-art"><div className="art-grid"/><div className="art-circle circle-one"/><div className="art-circle circle-two"/><span className="art-top">THE SPIRIT OF ORO</span><div className="butterfly-main"><Butterfly /></div><div className="art-caption"><span>ROOTED IN CULTURE.<br />READY TO SOAR.</span><span className="art-symbol">✳</span></div><span className="art-side">BEAUTY WITH PURPOSE / {event.year}</span><div className="art-stamp"><span>PEOPLE’S</span><Crown size={22} strokeWidth={1}/><span>CHOICE</span></div></div>
 </section>
 <div className="ribbon"><span>CULTURE</span><span>✳</span><span>CONFIDENCE</span><span>✳</span><span>COMMUNITY</span><span>✳</span><span>THE SPIRIT OF ORO</span><span>✳</span></div>
 <section id="contestants" className="contestants section"><div className="section-heading"><div><div className="eyebrow">THE PEOPLE’S CHOICE</div><h2>A province of stories.<br /><em>Find the one you stand for.</em></h2></div><p>Discover the women representing the heart of Oro.<br />Get to know her. Be part of her story.</p></div>
 <div className="section-toolbar"><div className="tabs" role="group" aria-label="Filter by district">{['All contestants', 'Ijivitari', 'Sohe'].map(t => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}{t === 'All contestants' && <span>{event.contestants.length}</span>}</button>)}</div><label className="search"><Search size={17}/><input aria-label="Search contestants" placeholder="Find a contestant…" value={search} onChange={e => setSearch(e.target.value)}/></label></div>
 <div className="demo-note"><span className="status-dot"/><span><strong>Preview lineup</strong> · {custom ? 'Your saved event draft.' : 'Names and portraits are placeholders.'} Practice votes are separate from official results.</span></div>
 {error && <div className="error-box" role="alert">{error} <button onClick={load}>Try again</button></div>}
 <div className="contestant-grid">{filtered.map(c => { const i = event.contestants.indexOf(c); return <article className="contestant-card" id={c.id} key={c.id}><button className="portrait-button" onClick={() => open(c)} aria-label={`Meet ${c.name}`}><Portrait index={i} image={c.image} name={c.name}/><span className="portrait-tag">{c.district} DISTRICT</span><span className="portrait-arrow"><ArrowUpRight size={21}/></span></button><div className="card-meta"><span>ORO {event.year} / {String(i + 1).padStart(2, '0')}</span><span>{counts[c.id] || 0} practice {(counts[c.id] || 0) === 1 ? 'vote' : 'votes'}</span></div><h3><button onClick={() => open(c)}>{c.name}</button></h3><p>{c.community}</p><button className={'card-vote ' + (ballot?.contestantId === c.id ? 'voted' : '')} onClick={() => open(c)}>{ballot?.contestantId === c.id ? <><Check size={16}/> Your practice choice</> : <>Meet & support her <ArrowRight size={17}/></>}</button></article>; })}</div>
 {!filtered.length && <div className="empty-state"><Search /><h3>No contestants found</h3><p>Try another name or explore both districts.</p><button className="button" onClick={() => { setSearch(''); setTab('All contestants'); }}>Show everyone</button></div>}
 <div className="lineup-note"><ShieldCheck size={17}/><span>{loading ? 'Loading voting status…' : `${total} practice votes recorded. Official lineup and voting dates will be announced here.`}</span></div>
 </section>
 <Leaderboard embedded/><section id="how-it-works" className="how-section section"><div className="how-intro"><div className="eyebrow">A LITTLE SUPPORT. A BIG DIFFERENCE.</div><h2>Your voice.<br /><em>Her next chapter.</em></h2><p>A simple way to stand behind the women who inspire our province.</p><span className="how-label"><span className="status-dot"/> PRACTICE THE JOURNEY BELOW</span></div><div className="steps">{[['01', 'Find your favourite', 'Explore the lineup and open a profile to discover her story, community and purpose.'], ['02', 'Make your choice', 'Try the practice voting flow. Review your selection before confirming your support.'], ['03', 'Share her journey', 'Invite friends and family to discover the pageant. Every story deserves to be heard.']].map(([n, title, body]) => <div className="step" key={n}><span>{n}</span><div><h3>{title}</h3><p>{body}</p></div><ArrowUpRight size={20}/></div>)}<div className="rules-note"><ShieldCheck size={20}/><p>For this preview: one practice vote per signed-in account, per draft version. Official eligibility, voting limits and dates will be published before launch.</p></div></div></section>
 <section id="our-story" className="story-section section"><div className="story-art"><Butterfly /><span>ORO, OUR HOME.</span></div><div className="story-copy"><div className="eyebrow">MORE THAN A CROWN</div><h2>Our culture.<br />Our women.<br /><em>Our future.</em></h2><p>{event.title} is a space to celebrate the voices and aspirations of women across our province. Rooted in community, inspired by heritage, and looking ahead.</p><div className="event-details"><span><CalendarDays size={17}/>{event.date}</span><span><MapPin size={17}/>{event.venue}</span></div><button className="text-link" onClick={() => share()}>Share the pageant <Share2 size={16}/></button></div></section>
 <section className="closing"><span>EVERY JOURNEY NEEDS A COMMUNITY.</span><h2>Be part of <em>hers.</em></h2><a href="#contestants" className="button light">Discover the lineup <ArrowUpRight size={18}/></a></section>
 </main>
 <footer><a href="/" className="brand"><Butterfly /><span>ORO<span className="brand-year">{event.year}</span></span></a><p>Culture. Confidence. Community.</p><div><a href="/admin">Admin login <ArrowUpRight size={13}/></a><a href="#how-it-works">Voting information</a><span>© {event.year} Oro Pageant · Preview</span></div></footer>
 <dialog aria-label="Contestant profile and practice vote" ref={dialog} onCancel={() => setSelected(null)} onClick={e => { if (e.target === dialog.current)
        setSelected(null); }}><button className="dialog-close icon-button" aria-label="Close profile" onClick={() => setSelected(null)}><X /></button>{selected && <div className="dialog-inner">{step === 'success' ? <div className="vote-success"><CheckCircle2 size={52}/><div className="eyebrow">YOUR VOICE WAS HEARD</div><h2>Thank you for<br /><em>standing with her.</em></h2><p>Your practice vote for <strong>{selected.name}</strong> is recorded. It does not count towards an official pageant result.</p><div className="receipt">PRACTICE RECEIPT<span>{receipt}</span></div><button className="button primary" onClick={() => share(selected)}>Share her profile <Share2 size={17}/></button><button className="text-link" onClick={() => setSelected(null)}>Back to the lineup <ArrowRight size={16}/></button></div> : <><Portrait index={event.contestants.indexOf(selected)} image={selected.image} name={selected.name}/><div className="profile-content"><div className="eyebrow">{selected.district} DISTRICT · EVENT PREVIEW</div><h2>{selected.name}</h2><span className="profile-community"><MapPin size={15}/>{selected.community}</span><p>{selected.bio}</p>{step === 'confirm' ? <div className="confirm-box"><h3>Make this your practice choice?</h3><p>You’re supporting {selected.name}. This single practice vote cannot be changed.</p><button className="button primary" disabled={busy} onClick={vote}>{busy ? <Loader2 size={18} className="spin"/> : <Check size={18}/>}Confirm practice vote</button><button className="text-link" disabled={busy} onClick={() => setStep('profile')}>Go back</button></div> : ballot ? <div className="confirm-box"><CheckCircle2 size={22}/><h3>Your practice vote is recorded.</h3><p>{ballot.contestantId === selected.id ? 'This is the contestant you supported.' : 'You have already supported another contestant in this practice round.'}</p><button className="text-link" onClick={() => share(selected)}>Share this profile <Share2 size={16}/></button></div> : signedIn ? <button className="button primary" disabled={loading || !!error} onClick={() => setStep('confirm')}>Try a practice vote <Heart size={17}/></button> : <a className="button primary" href="/signin-with-chatgpt?return_to=%2F%23contestants" target="_top">Sign in to practice <ArrowUpRight size={17}/></a>}<div className="profile-warning"><ShieldCheck size={16}/>Official voting is not open. No payments are collected.</div></div></>}</div>}</dialog>
 {notice && <div className="toast" role="status">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={16}/></button></div>}
 </>;
}
