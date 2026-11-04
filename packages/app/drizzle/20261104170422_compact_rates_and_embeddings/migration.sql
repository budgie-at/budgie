CREATE TABLE `__new_historical_exchange_rates` (
	`source_instrument_id` integer NOT NULL,
	`target_instrument_id` integer NOT NULL,
	`rate_date` text NOT NULL,
	`rate` integer NOT NULL,
	CONSTRAINT `historical_exchange_rates_pk` PRIMARY KEY(`source_instrument_id`, `target_instrument_id`, `rate_date`),
	CONSTRAINT `fk_historical_exchange_rates_source_instrument_id_instruments_id_fk` FOREIGN KEY (`source_instrument_id`) REFERENCES `instruments`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_historical_exchange_rates_target_instrument_id_instruments_id_fk` FOREIGN KEY (`target_instrument_id`) REFERENCES `instruments`(`id`) ON DELETE CASCADE
) WITHOUT ROWID;--> statement-breakpoint
INSERT INTO `__new_historical_exchange_rates`(`source_instrument_id`, `target_instrument_id`, `rate_date`, `rate`) SELECT `source_instrument_id`, `target_instrument_id`, `rate_date`, `rate` FROM `historical_exchange_rates` WHERE `deleted_at` IS NULL ORDER BY `source_instrument_id`, `target_instrument_id`, `rate_date`;--> statement-breakpoint
DROP TABLE `historical_exchange_rates`;--> statement-breakpoint
ALTER TABLE `__new_historical_exchange_rates` RENAME TO `historical_exchange_rates`;--> statement-breakpoint
ALTER TABLE `comment_embeddings` DROP COLUMN `embedding`;--> statement-breakpoint
ALTER TABLE `comment_embeddings` DROP COLUMN `dimensions`;--> statement-breakpoint
ALTER TABLE `merchant_embeddings` DROP COLUMN `embedding`;--> statement-breakpoint
ALTER TABLE `merchant_embeddings` DROP COLUMN `dimensions`;--> statement-breakpoint
DROP INDEX `idx_transaction_entries_transaction_id`;--> statement-breakpoint
DROP INDEX `idx_transaction_entries_account_id`;
