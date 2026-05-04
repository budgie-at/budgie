ALTER TABLE `transactions` ADD COLUMN `consolidation_parent_transaction_id` integer REFERENCES `transactions`(`id`) ON DELETE set null;
--> statement-breakpoint
ALTER TABLE `transactions` ADD COLUMN `consolidation_type` text;
--> statement-breakpoint
ALTER TABLE `transaction_entries` ADD COLUMN `original_transaction_id` integer REFERENCES `transactions`(`id`) ON DELETE set null;
--> statement-breakpoint
CREATE INDEX `transactions_visible_operated_idx` ON `transactions` (`operated_at`) WHERE `deleted_at` IS NULL AND `consolidation_parent_transaction_id` IS NULL;
--> statement-breakpoint
CREATE INDEX `transactions_consolidation_parent_idx` ON `transactions` (`consolidation_parent_transaction_id`) WHERE `consolidation_parent_transaction_id` IS NOT NULL;
--> statement-breakpoint
CREATE INDEX `transaction_entries_original_transaction_idx` ON `transaction_entries` (`original_transaction_id`) WHERE `original_transaction_id` IS NOT NULL;
--> statement-breakpoint
CREATE INDEX `transaction_entries_ledger_account_idx` ON `transaction_entries` (`account_id`) WHERE `deleted_at` IS NULL AND `original_transaction_id` IS NULL;
