import { eq, sql } from 'drizzle-orm';
import { getAdmin } from '../../../../lib/admin';
import { getDb } from '../../../../db';
import { drafts, publishedEvents } from '../../../../db/schema';
import { json, sameOrigin } from '../../../../lib/event-server';
import { eventSchema } from '../../../../lib/event';
export async function POST(request: Request) {
    if (!sameOrigin(request)) return json({error:'Request origin not allowed.'},403);
    const admin = await getAdmin();
    if (!admin) return json({error:'Administrator access required.'},403);
    try {
        const draft = await getDb().select().from(drafts).where(eq(drafts.ownerId,admin.userId)).get();
        if (!draft) return json({error:'Save an event draft before publishing.'},400);
        const event = eventSchema.parse(JSON.parse(draft.payload));
        const result = await getDb().insert(publishedEvents).values({id:'main',payload:JSON.stringify(event),revision:1,publishedAt:new Date().toISOString()})
            .onConflictDoUpdate({target:publishedEvents.id,set:{payload:JSON.stringify(event),revision:sql`${publishedEvents.revision} + 1`,publishedAt:new Date().toISOString()}})
            .returning({revision:publishedEvents.revision});
        return json({message:'Lineup published for everyone. A fresh practice round has started; previous votes are retained separately.',revision:result[0].revision});
    } catch(e) { console.error(JSON.stringify({event:'publish_failed',message:e instanceof Error?e.message:'unknown'})); return json({error:'Unable to publish the lineup. Please try again.'},503); }
}
