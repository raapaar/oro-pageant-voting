CREATE TABLE `published_events` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`revision` integer NOT NULL,
	`published_at` text NOT NULL
);
