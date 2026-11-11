import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const drafts = sqliteTable('event_drafts', { ownerId: text('owner_id').primaryKey(), payload: text('payload').notNull(), revision: integer('revision').notNull().default(1) });
export const votes = sqliteTable('practice_votes', { id: text('id').primaryKey(), eventKey: text('event_key').notNull(), voterId: text('voter_id').notNull(), contestantId: text('contestant_id').notNull(), createdAt: text('created_at').notNull() }, t => [uniqueIndex('one_practice_vote').on(t.eventKey, t.voterId)]);

// A single shared public event; private editor drafts remain separate.
export const publishedEvents = sqliteTable('published_events', {
    id: text('id').primaryKey(),
    payload: text('payload').notNull(),
    revision: integer('revision').notNull(),
    publishedAt: text('published_at').notNull(),
});
