ALTER TABLE `accounts` ADD `title_search` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD `title_search` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `tags` ADD `title_search` text DEFAULT '' NOT NULL;--> statement-breakpoint
-- DEPRECATED: SQLite's LOWER() only handles ASCII. These UPDATEs are superseded by
-- titleSearchDataMigrationService which uses JavaScript's toLowerCase() for proper Unicode support.
-- Kept for initial schema population only.
UPDATE `accounts` SET `title_search` = LOWER(`title`);--> statement-breakpoint
UPDATE `categories` SET `title_search` = LOWER(`title`);--> statement-breakpoint
UPDATE `tags` SET `title_search` = LOWER(`title`);