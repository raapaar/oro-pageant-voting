'use client';
import {useState,useEffect,useCallback} from 'react';
import {ArrowUpRight,RefreshCw,Trophy,Download,ShieldCheck} from 'lucide-react';
import {rankContestants} from '../../lib/leaderboard';
import {defaultEvent,type EventData} from '../../lib/event';
type LeaderboardPayload = {event:EventData;counts:{id:string;count:number}[];error?:string};
export default function Leaderboard({embedded=false,admin=false}:{embedded?:boolean;admin?:boolean}) {
    const [data,setData]=useState<LeaderboardPayload|null>(null),[error,setError]=useState(''),[updated,setUpdated]=useState(''),[busy,setBusy]=useState(false);
    const refresh=useCallback(async(signal?:AbortSignal)=>{
        setBusy(true);
        try {
            const draft=new URLSearchParams(location.search).get('preview')==='draft';
            const response=await fetch(`/api/event${draft?'?draft=1':''}`,{signal,cache:'no-store'});
            const value=await response.json() as LeaderboardPayload;
            if(!response.ok)throw Error(value.error||'Leaderboard is temporarily unavailable.');
            if(signal?.aborted)return;
            setData(value);setError('');setUpdated(new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'}));
        } catch(e){if(!signal?.aborted)setError(e instanceof Error?e.message:'Unable to refresh the leaderboard.');}
        finally{if(!signal?.aborted)setBusy(false);}
    },[]);
    useEffect(()=>{
        const controller=new AbortController();
        refresh(controller.signal);
        const timer=setInterval(()=>{if(!document.hidden)refresh(controller.signal)},15000);
        const focus=()=>refresh(controller.signal);window.addEventListener('focus',focus);
        return()=>{controller.abort();clearInterval(timer);window.removeEventListener('focus',focus)};
    },[refresh]);
    const {rows,total}=rankContestants(data?.event.contestants||[],data?.counts||[]);
    function exportCSV(){
        const safe=(value:string)=>'"'+(/^[=+@\-\t\r]/.test(value)?"'"+value:value).replaceAll('"','""')+'"';
        const lines=[['Rank','Contestant','District','Practice votes','Share (%)'],...rows.map(r=>[r.rank===null?'Unranked':String(r.rank),r.name,r.district,String(r.votes),r.share.toFixed(2)])];
        const blob=new Blob([lines.map(row=>row.map(safe).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
        const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='oro-practice-leaderboard.csv';link.click();URL.revokeObjectURL(url);
    }
    return <section className={embedded?'leaderboard-section section':'leaderboard-page section'} id="leaderboard"><div className="section-heading"><div><div className="eyebrow"><Trophy size={13}/>THE PEOPLE’S VOICE</div><h2>Every voice.<br/><em>Every step forward.</em></h2></div><div className="leaderboard-summary"><span className="leaderboard-total">{data?total.toLocaleString():'—'}</span><span>practice votes recorded</span><div className="leaderboard-live"><span className="status-dot"/>{updated?`Updated ${updated}`:'Loading standings…'}</div></div></div><div className="leaderboard-toolbar"><div><strong>Practice vote leaderboard</strong><span>Updates every 15 seconds · Tied votes share a rank</span></div><div className="leaderboard-controls"><button className="text-link" onClick={()=>refresh()} disabled={busy}><RefreshCw size={14} className={busy?'spin':''}/>Refresh</button>{admin&&<button className="text-link" onClick={exportCSV} disabled={!data}><Download size={14}/>Export CSV</button>}</div></div>{error&&<div className="error-box" role="alert">{error}{data?' Showing the last available standings.':''}</div>}<div className="leaderboard-table-wrap"><table className="leaderboard-table"><thead><tr><th scope="col">Rank</th><th scope="col">Contestant</th><th scope="col">District</th><th scope="col">Practice votes</th><th scope="col">Vote share</th></tr></thead><tbody>{rows.map(row=><tr key={row.id} className={row.rank===1?'leading-row':''}><td>{row.rank===1?<span className="rank-first"><Trophy size={15}/>1</span>:<span className="rank-number">{row.rank===null?'—':String(row.rank).padStart(2,'0')}</span>}</td><th scope="row"><a href={`/#${row.id}`}>{row.name}<ArrowUpRight size={13}/></a></th><td>{row.district}</td><td className="vote-number">{row.votes.toLocaleString()}</td><td><div className="share-cell"><div className="share-track"><div style={{width:`${row.share}%`}}/></div><span>{row.share.toFixed(1)}%</span></div></td></tr>)}</tbody></table></div>{!data&&!error&&<p className="leaderboard-empty">Loading vote counts…</p>}{data&&total===0&&<div className="leaderboard-empty"><Trophy size={22}/><h3>The journey starts here.</h3><p>No practice votes yet. All contestants begin on equal ground.</p></div>}<div className="lineup-note"><ShieldCheck size={16}/><span>These are practice standings. Official voting is closed and no winner is being declared.</span></div>{embedded&&<div className="leaderboard-more"><a href="/leaderboard" className="text-link">Open the full leaderboard <ArrowUpRight size={15}/></a></div>}</section>;
}
