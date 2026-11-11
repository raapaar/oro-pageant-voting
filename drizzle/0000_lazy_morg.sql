CREATE TABLE `event_drafts` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `practice_votes` (
	`id` text PRIMARY KEY NOT NULL,
	`event_key` text NOT NULL,
	`voter_id` text NOT NULL,
	`contestant_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_practice_vote` ON `practice_votes` (`event_key`,`voter_id`);