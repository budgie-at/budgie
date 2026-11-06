CREATE TABLE `recurring_series_transaction` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`series_id` integer NOT NULL,
	`transaction_id` integer NOT NULL,
	`cycle_date` integer NOT NULL,
	`matched_by` text NOT NULL,
	`is_excluded` integer DEFAULT false NOT NULL,
	CONSTRAINT `fk_recurring_series_transaction_series_id_recurring_series_id_fk` FOREIGN KEY (`series_id`) REFERENCES `recurring_series`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_recurring_series_transaction_transaction_id_transactions_id_fk` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `recurring_series` ADD `source` text DEFAULT 'DETECTED' NOT NULL;--> statement-breakpoint
ALTER TABLE `recurring_series` ADD `account_id` integer REFERENCES accounts(id) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE `recurring_series` ADD `cadence_unit` text DEFAULT 'MONTH' NOT NULL;--> statement-breakpoint
ALTER TABLE `recurring_series` ADD `cadence_interval` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `recurring_series` ADD `anchor_date` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `recurring_series` ADD `instrument_id` integer REFERENCES instruments(id);--> statement-breakpoint
ALTER TABLE `recurring_series` ADD `ends_at` integer;--> statement-breakpoint
ALTER TABLE `recurring_series` ADD `reminder_days_before` integer;--> statement-breakpoint
ALTER TABLE `recurring_series` ADD `confidence` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `recurring_series_transaction_series_transaction_unq` ON `recurring_series_transaction` (`series_id`,`transaction_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `recurring_series_transaction_live_transaction_unq` ON `recurring_series_transaction` (`transaction_id`) WHERE "recurring_series_transaction"."is_excluded" = 0 AND "recurring_series_transaction"."deleted_at" IS NULL;--> statement-breakpoint
UPDATE `recurring_series`
SET `anchor_date` = `last_seen_at`,
    `confidence` = 60,
    `source` = 'DETECTED',
    `instrument_id` = (SELECT `default_instrument_id` FROM `settings` WHERE `deleted_at` IS NULL ORDER BY `id` LIMIT 1),
    `cadence_unit` = CASE
        WHEN `period_days` <= 22 THEN 'WEEK'
        WHEN `period_days` > 274 THEN 'YEAR'
        ELSE 'MONTH'
    END,
    `cadence_interval` = CASE
        WHEN `period_days` <= 10 THEN 1
        WHEN `period_days` <= 22 THEN 2
        WHEN `period_days` <= 45 THEN 1
        WHEN `period_days` <= 76 THEN 2
        WHEN `period_days` <= 137 THEN 3
        WHEN `period_days` <= 274 THEN 6
        ELSE 1
    END;
