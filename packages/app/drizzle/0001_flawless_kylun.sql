PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`deletedAt` integer,
	`balance` integer DEFAULT 0 NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`type` text DEFAULT 'BANK' NOT NULL,
	`currency` text DEFAULT 'UAH' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_accounts`("id", "createdAt", "updatedAt", "deletedAt", "balance", "title", "type", "currency") SELECT "id", "createdAt", "updatedAt", "deletedAt", "balance", "title", "type", "currency" FROM `accounts`;--> statement-breakpoint
DROP TABLE `accounts`;--> statement-breakpoint
ALTER TABLE `__new_accounts` RENAME TO `accounts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`deletedAt` integer,
	`title` text DEFAULT '' NOT NULL,
	`icon` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_categories`("id", "createdAt", "updatedAt", "deletedAt", "title", "icon") SELECT "id", "createdAt", "updatedAt", "deletedAt", "title", "icon" FROM `categories`;--> statement-breakpoint
DROP TABLE `categories`;--> statement-breakpoint
ALTER TABLE `__new_categories` RENAME TO `categories`;--> statement-breakpoint
CREATE TABLE `__new_tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`deletedAt` integer,
	`title` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_tags`("id", "createdAt", "updatedAt", "deletedAt", "title") SELECT "id", "createdAt", "updatedAt", "deletedAt", "title" FROM `tags`;--> statement-breakpoint
DROP TABLE `tags`;--> statement-breakpoint
ALTER TABLE `__new_tags` RENAME TO `tags`;--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`deletedAt` integer,
	`amount` integer DEFAULT 0 NOT NULL,
	`account_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`comment` text DEFAULT '' NOT NULL,
	`type` text DEFAULT 'EXPENSE' NOT NULL,
	`operated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("id", "createdAt", "updatedAt", "deletedAt", "amount", "account_id", "category_id", "title", "comment", "type", "operated_at") SELECT "id", "createdAt", "updatedAt", "deletedAt", "amount", "account_id", "category_id", "title", "comment", "type", "operated_at" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;