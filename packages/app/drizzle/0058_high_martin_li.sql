ALTER TABLE `settings` ADD `is_widget_amounts_enabled` integer DEFAULT true NOT NULL;
--> statement-breakpoint
UPDATE `settings` SET `is_widget_amounts_enabled` = 0 WHERE `is_pin_enabled` = 1;