import { getAdmin } from '../../lib/admin';
import { redirect } from 'next/navigation';
import Studio from './studio-client';
export const dynamic = 'force-dynamic';
export default async function StudioPage(){
    if (!await getAdmin()) redirect('/admin');
    return <Studio/>;
}
