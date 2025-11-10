CREATE TABLE `account_balances` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`deletedAt` integer,
	`parent_account_id` integer,
	`account_id` integer NOT NULL,
	`instrument_id` integer NOT NULL,
	`amount` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `u_idx_account_balances_account_ts` ON `account_balances` (`account_id`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_account_balances_parent_ts` ON `account_balances` (`parent_account_id`,`createdAt`);--> statement-breakpoint
CREATE TABLE `exchange_rates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`deletedAt` integer,
	`source` text,
	`base_instrument_id` integer NOT NULL,
	`quote_instrument_id` integer NOT NULL,
	`rate` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `u_idx_exchange_rates_key` ON `exchange_rates` (`base_instrument_id`,`quote_instrument_id`,`source`);--> statement-breakpoint
CREATE TABLE `transaction_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`deletedAt` integer,
	`type` text NOT NULL,
	`account_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	`parent_category_id` integer NOT NULL,
	`parent_account_id` integer,
	`instrument_id` integer NOT NULL,
	`transaction_id` integer NOT NULL,
	`amount` integer NOT NULL
);
--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`deletedAt` integer,
	`icon` text NOT NULL,
	`parent_id` integer,
	`order` integer DEFAULT 0 NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`type` text NOT NULL,
	`nature` text NOT NULL,
	`instrument_id` integer NOT NULL,
	`current_balance` integer DEFAULT 0 NOT NULL,
	`external_id` text,
	`external_source` text,
	`include_in_net_worth` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_accounts`("id", "createdAt", "updatedAt", "deletedAt", "icon", "parent_id", "order", "title", "type", "nature", "instrument_id", "current_balance", "external_id", "external_source", "include_in_net_worth") SELECT "id", "createdAt", "updatedAt", "deletedAt", "icon", "parent_id", "order", "title", "type", "nature", "instrument_id", "current_balance", "external_id", "external_source", "include_in_net_worth" FROM `accounts`;--> statement-breakpoint
DROP TABLE `accounts`;--> statement-breakpoint
ALTER TABLE `__new_accounts` RENAME TO `accounts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_accounts_parent` ON `accounts` (`parent_id`);--> statement-breakpoint
CREATE INDEX `idx_accounts_instrument` ON `accounts` (`instrument_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `u_idx_accounts_external` ON `accounts` (`external_source`,`external_id`);--> statement-breakpoint
CREATE TABLE `__new_tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`deletedAt` integer,
	`title` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_tags`("id", "createdAt", "updatedAt", "deletedAt", "title") SELECT "id", "createdAt", "updatedAt", "deletedAt", "title" FROM `tags`;--> statement-breakpoint
DROP TABLE `tags`;--> statement-breakpoint
ALTER TABLE `__new_tags` RENAME TO `tags`;