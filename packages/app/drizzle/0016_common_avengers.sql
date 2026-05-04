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
CREATE TABLE `rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`enabled` integer DEFAULT true NOT NULL,
	`condition_match_type` text DEFAULT 'ALL' NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`language` text DEFAULT 'en' NOT NULL,
	`default_account_id` integer,
	`default_instrument_id` integer,
	`theme` text DEFAULT 'SYSTEM' NOT NULL,
	`is_pin_enabled` integer DEFAULT false NOT NULL,
	`is_biometric_enabled` integer DEFAULT false NOT NULL,
	`show_cents` integer DEFAULT true NOT NULL,
	`is_vibration_enabled` integer DEFAULT true NOT NULL,
	`is_screenshot_protection_enabled` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`default_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`default_instrument_id`) REFERENCES `instruments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_settings`("id", "created_at", "updated_at", "deleted_at", "language", "default_account_id", "default_instrument_id", "theme", "is_pin_enabled", "is_biometric_enabled", "show_cents", "is_vibration_enabled", "is_screenshot_protection_enabled") SELECT "id", "created_at", "updated_at", "deleted_at", "language", "default_account_id", "default_instrument_id", "theme", "is_pin_enabled", "is_biometric_enabled", "show_cents", "is_vibration_enabled", "is_screenshot_protection_enabled" FROM `settings`;--> statement-breakpoint
DROP TABLE `settings`;--> statement-breakpoint
ALTER TABLE `__new_settings` RENAME TO `settings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `transactions` ADD `updated_by` text;--> statement-breakpoint
ALTER TABLE `transactions` ADD `needs_embedding` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` ADD `consolidation_parent_transaction_id` integer REFERENCES transactions(id);--> statement-breakpoint
ALTER TABLE `transactions` ADD `consolidation_type` text;--> statement-breakpoint
ALTER TABLE `transactions` ADD `operated_weekday` integer GENERATED ALWAYS AS (CAST(strftime('%w', operated_at, 'unixepoch') AS INTEGER)) VIRTUAL NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` ADD `operated_minute_of_day` integer GENERATED ALWAYS AS (CAST(strftime('%H', operated_at, 'unixepoch') AS INTEGER) * 60 + CAST(strftime('%M', operated_at, 'unixepoch') AS INTEGER)) VIRTUAL NOT NULL;--> statement-breakpoint
CREATE INDEX `transactions_needs_embedding_idx` ON `transactions` (`needs_embedding`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `transactions_operated_at_idx` ON `transactions` (`operated_at`) WHERE "transactions"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX `transactions_visible_operated_idx` ON `transactions` (`operated_at`) WHERE "transactions"."deleted_at" IS NULL AND "transactions"."consolidation_parent_transaction_id" IS NULL;--> statement-breakpoint
CREATE INDEX `transactions_consolidation_parent_idx` ON `transactions` (`consolidation_parent_transaction_id`) WHERE "transactions"."consolidation_parent_transaction_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `transactions_type_operated_idx` ON `transactions` (`type`,`operated_at`) WHERE "transactions"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX `transactions_from_account_idx` ON `transactions` (`from_account_id`) WHERE "transactions"."from_account_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `transactions_to_account_idx` ON `transactions` (`to_account_id`) WHERE "transactions"."to_account_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `transactions_external_idx` ON `transactions` (`external_source`,`external_id`) WHERE "transactions"."external_id" IS NOT NULL AND "transactions"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX `transactions_weekday_type_idx` ON `transactions` (`operated_weekday`,`type`) WHERE "transactions"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX `transactions_minute_of_day_idx` ON `transactions` (`operated_minute_of_day`) WHERE "transactions"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX `transactions_active_idx` ON `transactions` (`id`) WHERE "transactions"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX `transactions_pending_merchant_idx` ON `transactions` ("operated_at" DESC) WHERE "transactions"."needs_embedding" = 1 AND "transactions"."deleted_at" IS NULL AND "transactions"."title" != '';--> statement-breakpoint
CREATE INDEX `transactions_pending_comment_idx` ON `transactions` ("operated_at" DESC) WHERE "transactions"."needs_embedding" = 1 AND "transactions"."deleted_at" IS NULL AND "transactions"."title" = '' AND "transactions"."comment" != '';--> statement-breakpoint
ALTER TABLE `transaction_entries` ADD `exchange_rate` real DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `transaction_entries` ADD `to_iban` text;--> statement-breakpoint
ALTER TABLE `transaction_entries` ADD `original_transaction_id` integer REFERENCES transactions(id);--> statement-breakpoint
CREATE INDEX `transaction_entries_transaction_idx` ON `transaction_entries` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `transaction_entries_account_idx` ON `transaction_entries` (`account_id`);--> statement-breakpoint
CREATE INDEX `transaction_entries_original_transaction_idx` ON `transaction_entries` (`original_transaction_id`) WHERE "transaction_entries"."original_transaction_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `transaction_entries_ledger_account_idx` ON `transaction_entries` (`account_id`) WHERE "transaction_entries"."deleted_at" IS NULL AND "transaction_entries"."original_transaction_id" IS NULL;--> statement-breakpoint
CREATE INDEX `transaction_entries_category_idx` ON `transaction_entries` (`category_id`) WHERE "transaction_entries"."category_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `transaction_entries_category_type_idx` ON `transaction_entries` (`category_id`,`type`) WHERE "transaction_entries"."category_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE `transaction_tags` ADD `is_primary` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `transaction_tags_tag_idx` ON `transaction_tags` (`tag_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `transaction_tags_primary_idx` ON `transaction_tags` (`transaction_id`) WHERE "transaction_tags"."is_primary" = 1;--> statement-breakpoint
CREATE INDEX `exchange_rates_lookup_idx` ON `exchange_rates` (`base_instrument_id`,`quote_instrument_id`,"created_at" DESC) WHERE "exchange_rates"."deleted_at" IS NULL;