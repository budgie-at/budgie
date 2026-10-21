ALTER TABLE `bank_syncs` ADD `reconciled_at` integer;--> statement-breakpoint
ALTER TABLE `bank_syncs` ADD `reconciled_balance` integer;--> statement-breakpoint
ALTER TABLE `bank_syncs` ADD `reconciliation_transaction_id` integer;--> statement-breakpoint
ALTER TABLE `transaction_entries` ADD `provider_balance` integer;