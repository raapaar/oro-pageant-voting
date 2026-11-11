/** Exercises the production Worker and real D1 binding without a browser or HTTP server. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {Miniflare}=createRequire(require.resolve('wrangler'))('miniflare');
const config=JSON.parse(fs.readFileSync('dist/server/wrangler.json','utf8'));
const root=path.resolve('dist/server');
const modules=[{type:'ESModule',path:path.join(root,'index.js')},...fs.readdirSync(root,{recursive:true}).filter(n=>/\.m?js$/.test(n)&&n!=='index.js').map(n=>({type:'ESModule',path:path.join(root,n)}))];
const mf=new Miniflare({modules,modulesRoot:root,compatibilityDate:config.compatibility_date,compatibilityFlags:config.compatibility_flags,d1Databases:['DB'],bindings:{ADMIN_EMAIL:'admin@example.test'}});
const admin={id:'admin-1',email:'admin@example.test'};
const visitor={id:'visitor-1',email:'visitor@example.test'};
async function request(route,{user,body,method=body===undefined?'GET':'POST',origin='https://pageant.test'}={}){
 const headers={'Origin':origin,'Content-Type':'application/json'};
 if(user){headers['oai-authenticated-user-id']=user.id;headers['oai-authenticated-user-email']=user.email;}
 const response=await mf.dispatchFetch('https://pageant.test'+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body),redirect:'manual'});
 const type=response.headers.get('content-type')||'';
 return {status:response.status,data:type.includes('json')?await response.json():await response.text(),location:response.headers.get('location')};
}
try{
 const db=await mf.getD1Database('DB');
 for(const name of fs.readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort()){
  for(const statement of fs.readFileSync('drizzle/'+name,'utf8').split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))await db.prepare(statement).run();
 }
 assert.equal((await request('/api/event')).status,200);
 assert.equal((await request('/api/event?draft=1')).status,403);
 assert.equal((await request('/api/event?draft=1',{user:visitor})).status,403);
 assert.equal((await request('/api/draft',{body:{},user:visitor})).status,403);
 assert.equal((await request('/api/admin/publish',{method:'POST',user:visitor})).status,403);
 assert.equal((await request('/studio')).status,307);
 const login=await request('/admin');assert.equal(login.status,200);assert(login.data.includes('Admin sign in with ChatGPT'));
 const unauthorised=await request('/admin',{user:visitor});assert(unauthorised.data.includes('does not have administrator access'));
 const dashboard=await request('/admin',{user:admin});assert(dashboard.data.includes('Welcome, organiser.'));
 const initial=(await request('/api/event')).data;
 const draft={...initial.event,title:'Private admin test event'};
 assert.equal((await request('/api/draft',{user:admin,body:draft,origin:'https://other.test'})).status,403);
 assert.equal((await request('/api/draft',{user:admin,body:draft})).status,200);
 assert.equal((await request('/api/event')).data.event.title,initial.event.title);
 assert.equal((await request('/api/event?draft=1',{user:admin})).data.event.title,draft.title);
 assert.equal((await request('/api/admin/publish',{user:admin,method:'POST'})).status,200);
 assert.equal((await request('/api/event')).data.event.title,draft.title);
 const body={contestantId:draft.contestants[0].id,mode:'practice'};
 assert.equal((await request('/api/vote',{body})).status,401);
 assert.equal((await request('/api/vote',{user:visitor,body:{...body,mode:'official'}})).status,400);
 assert.equal((await request('/api/vote',{user:visitor,body:{...body,draft:true}})).status,403);
 const results=await Promise.all(Array.from({length:8},()=>request('/api/vote',{user:visitor,body})));
 assert.equal(results.filter(r=>r.status===201).length,1);
 assert.equal(results.filter(r=>r.status===409).length,7);
 assert.equal((await request('/api/event')).data.counts[0].count,1);
 assert.equal((await request('/api/admin/publish',{user:admin,method:'POST'})).status,200);
 assert.equal((await request('/api/event')).data.counts.length,0);
 const oldVotes=await db.prepare('SELECT COUNT(*) AS total FROM practice_votes').first();assert.equal(oldVotes.total,1);
 console.log('PASS: production Worker login, admin/visitor authorization, CSRF, protected drafts, shared publication, official votes blocked, 8 concurrent ballots → 1 vote, leaderboard totals, and preserved round history.');
}finally{await mf.dispose()}
