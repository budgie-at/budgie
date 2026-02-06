DELETE FROM `title_embeddings`;--> statement-breakpoint
DROP INDEX `title_embeddings_title_unique`;--> statement-breakpoint
ALTER TABLE `title_embeddings` ADD `context` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `title_embeddings_context_unique` ON `title_embeddings` (`context`);