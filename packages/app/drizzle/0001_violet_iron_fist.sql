PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transaction_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`type` text NOT NULL,
	`account_id` integer NOT NULL,
	`category_id` integer,
	`transaction_id` integer NOT NULL,
	`amount` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_transaction_entries`("id", "created_at", "updated_at", "deleted_at", "type", "account_id", "category_id", "transaction_id", "amount") SELECT "id", "created_at", "updated_at", "deleted_at", "type", "account_id", "category_id", "transaction_id", "amount" FROM `transaction_entries`;--> statement-breakpoint
DROP TABLE `transaction_entries`;--> statement-breakpoint
ALTER TABLE `__new_transaction_entries` RENAME TO `transaction_entries`;--> statement-breakpoint
PRAGMA foreign_keys=ON;