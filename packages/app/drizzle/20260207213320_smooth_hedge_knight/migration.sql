CREATE INDEX IF NOT EXISTS `idx_transaction_entries_transaction_id` ON `transaction_entries` (`transaction_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_transaction_entries_category_id` ON `transaction_entries` (`category_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_transaction_entries_account_id` ON `transaction_entries` (`account_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_transactions_title` ON `transactions` (`title`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_title_embeddings_title` ON `title_embeddings` (`title`);
