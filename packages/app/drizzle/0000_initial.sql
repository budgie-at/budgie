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
CREATE TABLE `accounts` (
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
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`deletedAt` integer,
	`title` text DEFAULT '' NOT NULL,
	`icon` text NOT NULL,
	`parent_id` integer
);
--> statement-breakpoint
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
CREATE TABLE `instruments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`deletedAt` integer,
	`type` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`symbol` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`deletedAt` integer,
	`title` text NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE `transaction_tags` (
	`transaction_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`transaction_id`, `tag_id`)
);
