import { z } from 'zod';
import { getChatGPTUser } from '../../chatgpt-auth';
import { eventFor, sameOrigin, json, readBoundedJson } from '../../../lib/event-server';
import { getAdmin } from '../../../lib/admin';
import { getDb } from '../../../db';
import { votes } from '../../../db/schema';
export async function POST(request: Request) {
    if (!sameOrigin(request))
        return json({ error: 'Request origin not allowed.' }, 403);
    const user = await getChatGPTUser();
    if (!user)
        return json({ error: 'Sign in to cast a practice vote.' }, 401);
    if (Number(request.headers.get('content-length') || 0) > 2048)
        return json({ error: 'Request too large.' }, 413);
    try {
        const body = z.object({mode:z.literal('practice'),contestantId:z.string().min(1).max(40),draft:z.boolean().optional()}).parse(await readBoundedJson(request,2048));
        if(body.draft && !await getAdmin()) return json({error:'Administrator access required.'},403);
        const { event, key } = await eventFor(user.userId, body.draft === true);
        if (body.mode !== 'practice' || !event.contestants.some(c => c.id === body.contestantId))
            return json({ error: 'Choose a valid practice contestant.' }, 400);
        const id = crypto.randomUUID();
        const inserted = await getDb().insert(votes).values({ id, eventKey: key, voterId: user.userId, contestantId: body.contestantId, createdAt: new Date().toISOString() }).onConflictDoNothing().returning({ id: votes.id });
        if (!inserted.length)
            return json({ error: 'You have already cast your practice vote for this event.' }, 409);
        return json({ receipt: id, message: 'Practice vote recorded. This does not count towards an official result.' }, 201);
    }
    catch (e) {
        console.error(JSON.stringify({ event: 'practice_vote_failed', message: e instanceof Error ? e.message : 'unknown' }));
        return json({ error: 'Your vote could not be recorded. Please try again.' }, 400);
    }
}
