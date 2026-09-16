ALTER TABLE `bank_syncs` ADD `backward_batch_sequence` integer;--> statement-breakpoint
ALTER TABLE `bank_syncs` ADD `balance_authority` text DEFAULT 'LEDGER' NOT NULL;--> statement-breakpoint
ALTER TABLE `bank_syncs` ADD `balance_anchor_captured_at` integer;--> statement-breakpoint
ALTER TABLE `bank_syncs` ADD `balance_adjustment_transaction_id` integer;