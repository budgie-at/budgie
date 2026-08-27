ALTER TABLE `transaction_entries` ADD `quoted_instrument_id` integer REFERENCES instruments(id) ON DELETE set null;
--> statement-breakpoint
ALTER TABLE `transaction_entries` ADD `quoted_amount` integer;
--> statement-breakpoint
ALTER TABLE `transaction_entries` ADD `quoted_unit_price` integer;
--> statement-breakpoint
CREATE INDEX `transaction_entries_quote_idx`
ON `transaction_entries` (`quoted_instrument_id`, `quoted_amount`)
WHERE `deleted_at` IS NULL
  AND `quoted_instrument_id` IS NOT NULL
  AND `quoted_amount` IS NOT NULL;
