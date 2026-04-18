ALTER TABLE `transactions` ADD `needs_embedding` integer DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE `transactions` SET `needs_embedding` = 1;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `transactions_needs_embedding_idx` ON `transactions` (`needs_embedding`,`deleted_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `transactions_operated_at_idx` ON `transactions` (`operated_at`) WHERE `deleted_at` IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `transactions_type_operated_idx` ON `transactions` (`type`, `operated_at`) WHERE `deleted_at` IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `transactions_from_account_idx` ON `transactions` (`from_account_id`) WHERE `from_account_id` IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `transactions_to_account_idx` ON `transactions` (`to_account_id`) WHERE `to_account_id` IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `transactions_external_idx` ON `transactions` (`external_source`, `external_id`) WHERE `external_id` IS NOT NULL AND `deleted_at` IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `transaction_entries_transaction_idx` ON `transaction_entries` (`transaction_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `transaction_entries_account_idx` ON `transaction_entries` (`account_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `transaction_entries_category_idx` ON `transaction_entries` (`category_id`) WHERE `category_id` IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `transaction_entries_category_type_idx` ON `transaction_entries` (`category_id`, `type`) WHERE `category_id` IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `transaction_tags_tag_idx` ON `transaction_tags` (`tag_id`);
