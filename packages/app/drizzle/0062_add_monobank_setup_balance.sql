ALTER TABLE `bank_syncs` ADD `backward_batch_at` integer;--> statement-breakpoint
ALTER TABLE `bank_syncs` ADD `setup_balance` integer;--> statement-breakpoint
ALTER TABLE `bank_syncs` ADD `balance_adjustment_transaction_id` integer;