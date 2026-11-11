import { getAdmin } from '../../../lib/admin';
import { sameOrigin, json, readBoundedJson } from '../../../lib/event-server';
import { eventSchema } from '../../../lib/event';
import { getDb } from '../../../db';
import { drafts } from '../../../db/schema';
import { sql } from 'drizzle-orm';
export async function POST(request: Request) {
    if (!sameOrigin(request))
        return json({ error: 'Request origin not allowed.' }, 403);
    const user = await getAdmin();
    if (!user)
        return json({ error: 'Administrator access required.' }, 403);
    try {
        const result = eventSchema.safeParse(await readBoundedJson(request, 65000));
        if (!result.success)
            return json({ error: result.error.issues[0]?.message || 'Invalid event data.' }, 400);
        await getDb().insert(drafts).values({ ownerId: user.userId, payload: JSON.stringify(result.data), revision: 1 }).onConflictDoUpdate({ target: drafts.ownerId, set: { payload: JSON.stringify(result.data), revision: sql `${drafts.revision} + 1` } });
        return json({ message: 'Private draft saved. Preview it or publish the lineup when ready.' });
    }
    catch {
        return json({ error: 'Unable to save. Check your file and try again.' }, 400);
    }
}
