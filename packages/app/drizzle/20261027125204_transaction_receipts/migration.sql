CREATE TABLE `transaction_receipts` (
	`transaction_id` integer PRIMARY KEY,
	`fingerprint` text NOT NULL,
	`receipt_number` text,
	`merchant_vat_id` text,
	`merchant_legal_name` text,
	`scanned_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_transaction_receipts_transaction_id_transactions_id_fk` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transaction_receipts_fingerprint_idx` ON `transaction_receipts` (`fingerprint`);