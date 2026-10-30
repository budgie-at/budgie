ALTER TABLE `bank_integrations` ADD `external_client_id` text;--> statement-breakpoint
ALTER TABLE `bank_integrations` ADD `history_progress` text;--> statement-breakpoint
ALTER TABLE `bank_syncs` ADD `last_error_code` text;