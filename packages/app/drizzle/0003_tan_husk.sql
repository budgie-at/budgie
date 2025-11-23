PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`deletedAt` integer,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`external_id` text,
	`operated_at` text NOT NULL,
	`comment` text DEFAULT '' NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`to_account_id` integer,
	`from_account_id` integer,
	`exchange_rate` real NOT NULL,
	`external_source` text,
	FOREIGN KEY (`to_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`from_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("id", "createdAt", "updatedAt", "deletedAt", "type", "title", "external_id", "operated_at", "comment", "amount", "to_account_id", "from_account_id", "exchange_rate", "external_source") SELECT "id", "createdAt", "updatedAt", "deletedAt", "type", "title", "external_id", "operated_at", "comment", "amount", "to_account_id", "from_account_id", "exchange_rate", "external_source" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;