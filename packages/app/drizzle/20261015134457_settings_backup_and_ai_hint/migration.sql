ALTER TABLE `settings` ADD `last_backup_at` integer;--> statement-breakpoint
ALTER TABLE `settings` ADD `is_ai_note_hint_shown` integer DEFAULT false NOT NULL;