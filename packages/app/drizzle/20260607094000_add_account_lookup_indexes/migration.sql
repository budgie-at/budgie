CREATE INDEX IF NOT EXISTS `accounts_iban_active_idx` ON `accounts` (`iban`,`is_active`) WHERE `deleted_at` IS NULL AND `iban` IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `accounts_active_type_instrument_idx` ON `accounts` (`is_active`,`type`,`instrument_id`) WHERE `deleted_at` IS NULL;
