ALTER TABLE `transactions` ADD `needs_embedding` integer DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE `transactions` SET `needs_embedding` = 1;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `transactions_needs_embedding_idx` ON `transactions` (`needs_embedding`,`deleted_at`);
