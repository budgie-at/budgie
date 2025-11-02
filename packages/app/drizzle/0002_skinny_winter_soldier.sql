PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`deletedAt` integer,
	`instrument` text,
	`category_id` integer,
	`amount` integer DEFAULT 0 NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`pricePerUnit` integer DEFAULT 0 NOT NULL,
	`account_id` integer NOT NULL,
	`counter_account_id` integer,
	`title` text DEFAULT '' NOT NULL,
	`comment` text DEFAULT '' NOT NULL,
	`type` text DEFAULT 'EXPENSE' NOT NULL,
	`transferDirection` text DEFAULT 'IN' NOT NULL,
	`operated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("id", "createdAt", "updatedAt", "deletedAt", "instrument", "category_id", "amount", "quantity", "pricePerUnit", "account_id", "counter_account_id", "title", "comment", "type", "transferDirection", "operated_at") SELECT "id", "createdAt", "updatedAt", "deletedAt", "instrument", "category_id", "amount", "quantity", "pricePerUnit", "account_id", "counter_account_id", "title", "comment", "type", "transferDirection", "operated_at" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `accounts` ADD `order` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts` ADD `includeInNetWorth` integer DEFAULT true NOT NULL;