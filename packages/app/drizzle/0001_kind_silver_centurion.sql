PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transaction_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`deletedAt` integer,
	`type` text NOT NULL,
	`account_id` integer NOT NULL,
	`category_id` integer,
	`parent_category_id` integer,
	`parent_account_id` integer,
	`instrument_id` integer NOT NULL,
	`transaction_id` integer NOT NULL,
	`amount` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_transaction_entries`("id", "createdAt", "updatedAt", "deletedAt", "type", "account_id", "category_id", "parent_category_id", "parent_account_id", "instrument_id", "transaction_id", "amount") SELECT "id", "createdAt", "updatedAt", "deletedAt", "type", "account_id", "category_id", "parent_category_id", "parent_account_id", "instrument_id", "transaction_id", "amount" FROM `transaction_entries`;--> statement-breakpoint
DROP TABLE `transaction_entries`;--> statement-breakpoint
ALTER TABLE `__new_transaction_entries` RENAME TO `transaction_entries`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
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
	`to_account_id` integer,
	`from_account_id` integer,
	`exchange_rate` real NOT NULL,
	`external_source` text,
	FOREIGN KEY (`to_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`from_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("id", "createdAt", "updatedAt", "deletedAt", "type", "title", "external_id", "operated_at", "comment", "to_account_id", "from_account_id", "exchange_rate", "external_source") SELECT "id", "createdAt", "updatedAt", "deletedAt", "type", "title", "external_id", "operated_at", "comment", "to_account_id", "from_account_id", "exchange_rate", "external_source" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
CREATE TABLE `__new_transaction_tags` (
	`transaction_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`transaction_id`, `tag_id`),
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_transaction_tags`("transaction_id", "tag_id") SELECT "transaction_id", "tag_id" FROM `transaction_tags`;--> statement-breakpoint
DROP TABLE `transaction_tags`;--> statement-breakpoint
ALTER TABLE `__new_transaction_tags` RENAME TO `transaction_tags`;