ALTER TABLE `settings` ADD `is_ai_voice_input_enabled` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `settings` ADD `is_ai_suggestions_enabled` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `settings` ADD `is_ai_translations_enabled` integer DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE `settings`
SET
    `is_ai_voice_input_enabled` = `is_ai_enabled`,
    `is_ai_suggestions_enabled` = `is_ai_enabled`,
    `is_ai_translations_enabled` = `is_ai_enabled`;
