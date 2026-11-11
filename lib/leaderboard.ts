import type { EventData } from './event';
export function rankContestants(contestants: EventData['contestants'], counts: {id:string;count:number}[]) {
    const totals = new Map(counts.map(row=>[row.id,Math.max(0,Number(row.count)||0)]));
    const rows = contestants.map(c=>({...c,votes:totals.get(c.id)||0})).sort((a,b)=>b.votes-a.votes || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    const total = rows.reduce((sum,row)=>sum+row.votes,0);
    let rank = 0;
    let previous = -1;
    return {total,rows:rows.map((row,i)=>{
        if(row.votes!==previous)rank=i+1;
        previous=row.votes;
        return {...row,rank:row.votes>0?rank:null,share:total?row.votes/total*100:0};
    })};
}
