CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`deletedAt` integer,
	`locale` text,
	`language` text DEFAULT 'en' NOT NULL,
	`default_account_id` integer,
	`default_instrument_id` integer,
	`theme` text DEFAULT 'SYSTEM' NOT NULL,
	`hide_cents` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`default_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`default_instrument_id`) REFERENCES `instruments`(`id`) ON UPDATE no action ON DELETE no action
);
