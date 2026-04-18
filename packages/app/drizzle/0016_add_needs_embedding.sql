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
--> statement-breakpoint
ALTER TABLE `transactions` ADD COLUMN `operated_weekday` INTEGER GENERATED ALWAYS AS (CAST(strftime('%w', `operated_at`, 'unixepoch') AS INTEGER)) VIRTUAL;
--> statement-breakpoint
ALTER TABLE `transactions` ADD COLUMN `operated_minute_of_day` INTEGER GENERATED ALWAYS AS (CAST(strftime('%H', `operated_at`, 'unixepoch') AS INTEGER) * 60 + CAST(strftime('%M', `operated_at`, 'unixepoch') AS INTEGER)) VIRTUAL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `transactions_weekday_type_idx` ON `transactions` (`operated_weekday`, `type`) WHERE `deleted_at` IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `transactions_minute_of_day_idx` ON `transactions` (`operated_minute_of_day`) WHERE `deleted_at` IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `transactions_active_idx` ON `transactions` (`id`) WHERE `deleted_at` IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `transactions_pending_merchant_idx` ON `transactions` (`operated_at` DESC) WHERE `needs_embedding` = 1 AND `deleted_at` IS NULL AND `title` != '';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `transactions_pending_comment_idx` ON `transactions` (`operated_at` DESC) WHERE `needs_embedding` = 1 AND `deleted_at` IS NULL AND `title` = '' AND `comment` != '';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `exchange_rates_lookup_idx` ON `exchange_rates` (`base_instrument_id`, `quote_instrument_id`, `created_at` DESC) WHERE `deleted_at` IS NULL;

--> statement-breakpoint
CREATE VIRTUAL TABLE IF NOT EXISTS `categories_fts` USING fts5(title, content='categories', content_rowid='id', tokenize='unicode61 remove_diacritics 2');
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `categories_fts_ai` AFTER INSERT ON `categories` BEGIN
    INSERT INTO `categories_fts`(rowid, title) VALUES (new.id, new.title);
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `categories_fts_ad` AFTER DELETE ON `categories` BEGIN
    INSERT INTO `categories_fts`(`categories_fts`, rowid, title) VALUES ('delete', old.id, old.title);
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `categories_fts_au` AFTER UPDATE OF `title` ON `categories` BEGIN
    INSERT INTO `categories_fts`(`categories_fts`, rowid, title) VALUES ('delete', old.id, old.title);
    INSERT INTO `categories_fts`(rowid, title) VALUES (new.id, new.title);
END;
--> statement-breakpoint
INSERT INTO `categories_fts`(rowid, title) SELECT `id`, `title` FROM `categories` WHERE NOT EXISTS (SELECT 1 FROM `categories_fts` LIMIT 1);
--> statement-breakpoint
CREATE VIRTUAL TABLE IF NOT EXISTS `tags_fts` USING fts5(title, content='tags', content_rowid='id', tokenize='unicode61 remove_diacritics 2');
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `tags_fts_ai` AFTER INSERT ON `tags` BEGIN
    INSERT INTO `tags_fts`(rowid, title) VALUES (new.id, new.title);
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `tags_fts_ad` AFTER DELETE ON `tags` BEGIN
    INSERT INTO `tags_fts`(`tags_fts`, rowid, title) VALUES ('delete', old.id, old.title);
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `tags_fts_au` AFTER UPDATE OF `title` ON `tags` BEGIN
    INSERT INTO `tags_fts`(`tags_fts`, rowid, title) VALUES ('delete', old.id, old.title);
    INSERT INTO `tags_fts`(rowid, title) VALUES (new.id, new.title);
END;
--> statement-breakpoint
INSERT INTO `tags_fts`(rowid, title) SELECT `id`, `title` FROM `tags` WHERE NOT EXISTS (SELECT 1 FROM `tags_fts` LIMIT 1);
