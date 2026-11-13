ALTER TABLE `settings` ADD `crypto_strict_valuation_version` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `yield_tag_repair_version` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` ADD `yield_kind` text;--> statement-breakpoint
ALTER TABLE `transactions` ADD `yield_source_account_id` integer REFERENCES accounts(id) ON DELETE SET NULL;--> statement-breakpoint
CREATE INDEX `transactions_yield_kind_idx` ON `transactions` (`yield_kind`,`operated_at`) WHERE "transactions"."yield_kind" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `transactions_yield_source_idx` ON `transactions` (`yield_source_account_id`) WHERE "transactions"."yield_source_account_id" IS NOT NULL;