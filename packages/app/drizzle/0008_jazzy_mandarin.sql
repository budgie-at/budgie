ALTER TABLE `transaction_entries` ADD `exchange_rate` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `transaction_entries` ADD `to_iban` text;