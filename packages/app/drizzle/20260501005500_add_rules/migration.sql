CREATE TABLE `rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`enabled` integer DEFAULT true NOT NULL,
	`condition_match_type` text DEFAULT 'ALL' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rule_conditions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`rule_id` integer NOT NULL,
	`field` text NOT NULL,
	`operator` text NOT NULL,
	`value` text NOT NULL,
	`secondary_value` text,
	FOREIGN KEY (`rule_id`) REFERENCES `rules`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "rule_condition_between_requires_secondary_value" CHECK(operator != 'BETWEEN' OR secondary_value IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE `rule_actions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`rule_id` integer NOT NULL,
	`type` text NOT NULL,
	`category_id` integer,
	`tag_id` integer,
	`account_id` integer,
	FOREIGN KEY (`rule_id`) REFERENCES `rules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "rule_action_set_category_requires_category_id" CHECK(type != 'SET_CATEGORY' OR category_id IS NOT NULL),
	CONSTRAINT "rule_action_add_tag_requires_tag_id" CHECK(type != 'ADD_TAG' OR tag_id IS NOT NULL),
	CONSTRAINT "rule_action_convert_to_transfer_requires_account_id" CHECK(type != 'CONVERT_TO_TRANSFER' OR account_id IS NOT NULL)
);
