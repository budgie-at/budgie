CREATE INDEX `transaction_entries_uncategorized_transaction_idx` ON `transaction_entries` (`transaction_id`) WHERE `category_id` IS NULL AND `deleted_at` IS NULL AND `original_transaction_id` IS NULL;--> statement-breakpoint
DROP INDEX IF EXISTS `transactions_type_operated_idx`;--> statement-breakpoint
CREATE INDEX `transactions_visible_type_operated_idx` ON `transactions` (`type`,`operated_at`) WHERE `deleted_at` IS NULL AND `consolidation_parent_transaction_id` IS NULL;
