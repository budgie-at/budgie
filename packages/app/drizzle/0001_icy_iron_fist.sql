ALTER TABLE `settings` ADD `is_pin_enabled` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `settings` ADD `is_biometric_enabled` integer DEFAULT false NOT NULL;
