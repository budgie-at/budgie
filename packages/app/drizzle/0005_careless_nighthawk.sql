PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`icon` text DEFAULT 'Home' NOT NULL,
	`parent_id` integer,
	`order` integer DEFAULT 0 NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`type` text DEFAULT 'CASH' NOT NULL,
	`nature` text DEFAULT 'LIABILITY' NOT NULL,
	`debt_type` text DEFAULT 'LENT' NOT NULL,
	`instrument_id` integer NOT NULL,
	`external_id` text,
	`contact_id` text,
	`return_at` integer,
	`target_amount` integer DEFAULT 0 NOT NULL,
	`external_source` text,
	`include_in_net_worth` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`instrument_id`) REFERENCES `instruments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_accounts`("id", "created_at", "updated_at", "deleted_at", "icon", "parent_id", "order", "title", "type", "nature", "debt_type", "instrument_id", "external_id", "contact_id", "return_at", "target_amount", "external_source", "include_in_net_worth") SELECT "id", "created_at", "updated_at", "deleted_at", "icon", "parent_id", "order", "title", "type", "nature", "debt_type", "instrument_id", "external_id", "contact_id", "return_at", "target_amount", "external_source", "include_in_net_worth" FROM `accounts`;--> statement-breakpoint
DROP TABLE `accounts`;--> statement-breakpoint
ALTER TABLE `__new_accounts` RENAME TO `accounts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;