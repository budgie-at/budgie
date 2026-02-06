CREATE TABLE `title_embeddings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`title` text NOT NULL,
	`embedding` blob NOT NULL,
	`dimensions` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `title_embeddings_title_unique` ON `title_embeddings` (`title`);