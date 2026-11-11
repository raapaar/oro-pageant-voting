import { and, eq, sql } from 'drizzle-orm';
import { getChatGPTUser } from '../../chatgpt-auth';
import { eventFor, json } from '../../../lib/event-server';
import { getAdmin } from '../../../lib/admin';
import { getDb } from '../../../db';
import { votes } from '../../../db/schema';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
    try {
        const user = await getChatGPTUser();
        const draftMode = new URL(request.url).searchParams.get('draft') === '1';
        const admin = await getAdmin();
        if (draftMode && !admin) return json({error:'Administrator access required.'}, 403);
        const { event, key, custom } = await eventFor(user?.userId, draftMode);
        const counts = await getDb().select({ id: votes.contestantId, count: sql<number> `count(*)` }).from(votes).where(eq(votes.eventKey, key)).groupBy(votes.contestantId);
        const ballot = user ? await getDb().select({ contestantId: votes.contestantId, id: votes.id }).from(votes).where(and(eq(votes.eventKey, key), eq(votes.voterId, user.userId))).get() : null;
        return json({ event, counts, ballot, custom, signedIn: !!user, mode: 'practice', isAdmin: !!admin });
    }
    catch (e) {
        console.error(JSON.stringify({ event: 'event_read_failed', message: e instanceof Error ? e.message : 'unknown' }));
        return json({ error: 'Unable to load the event. Please try again.' }, 503);
    }
}
