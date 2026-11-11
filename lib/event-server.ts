import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { drafts, publishedEvents } from '../db/schema';
import { defaultEvent, eventSchema } from './event';
export async function eventFor(userId?: string, draftMode = false) {
    if (draftMode && userId) {
        const draft = await getDb().select().from(drafts).where(eq(drafts.ownerId, userId)).get();
        if (draft) return { event: eventSchema.parse(JSON.parse(draft.payload)), key: `draft:${userId}:${draft.revision}`, custom: true };
    }
    const live = await getDb().select().from(publishedEvents).where(eq(publishedEvents.id, 'main')).get();
    return live ? { event: eventSchema.parse(JSON.parse(live.payload)), key: `published:${live.revision}`, custom: false }
        : { event: defaultEvent, key: 'sample-v1', custom: false };
}
export function sameOrigin(request: Request) {
    const origin = request.headers.get('origin');
    return !!origin && origin === new URL(request.url).origin;
}
export function json(data: unknown, status = 200) {
    return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
export async function readBoundedJson(request: Request, maxBytes: number): Promise<unknown> {
    if (!request.body) throw new Error('A request body is required.');
    const reader = request.body.getReader();
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) { await reader.cancel(); throw new Error('Request too large.'); }
        chunks.push(value);
    }
    const joined = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder().decode(joined));
}
