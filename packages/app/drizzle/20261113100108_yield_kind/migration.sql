ALTER TABLE `transactions` ADD `yield_kind` text;--> statement-breakpoint
ALTER TABLE `transactions` ADD `yield_source_account_id` integer REFERENCES accounts(id) ON DELETE SET NULL;--> statement-breakpoint
CREATE INDEX `transactions_yield_kind_idx` ON `transactions` (`yield_kind`,`operated_at`) WHERE "transactions"."yield_kind" IS NOT NULL;