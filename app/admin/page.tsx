import { getAdmin } from '../../lib/admin';
import { getChatGPTUser } from '../chatgpt-auth';
import AdminDashboard from './dashboard';
import { ShieldCheck, ArrowUpRight, ArrowLeft } from 'lucide-react';
export const dynamic = 'force-dynamic';
export default async function AdminPage(){
    const user = await getChatGPTUser();
    const admin = await getAdmin();
    if (admin) return <AdminDashboard/>;
    return <main className="admin-login"><a href="/" className="text-link"><ArrowLeft size={16}/>Back to pageant</a><section><ShieldCheck size={35}/><div className="eyebrow">ORO PAGEANT · ADMINISTRATION</div><h1>Behind<br/><em>the spotlight.</em></h1><p>{user ? 'This account does not have administrator access. Sign in with the authorised organiser account to manage the pageant.' : 'Sign in with the authorised organiser account to manage contestants, event details and the published lineup.'}</p>{user ? <a className="button primary" href="/signout-with-chatgpt?return_to=%2Fadmin" target="_top">Sign out & switch account <ArrowUpRight size={16}/></a> : <a className="button primary" href="/signin-with-chatgpt?return_to=%2Fadmin" target="_top">Admin sign in with ChatGPT <ArrowUpRight size={16}/></a>}<span className="profile-warning"><ShieldCheck size={15}/>Only the approved administrator can save or publish event data.</span></section></main>;
}
