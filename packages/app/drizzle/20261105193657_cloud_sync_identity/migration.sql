CREATE TABLE `sync_apply_state` (
	`id` integer PRIMARY KEY,
	`is_applying` integer DEFAULT false NOT NULL,
	CONSTRAINT "sync_apply_state_single_row" CHECK("id" = 1)
);
--> statement-breakpoint
CREATE TABLE `sync_outbox` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`record_type` text NOT NULL,
	`sync_zone` text NOT NULL,
	`sync_id` text NOT NULL,
	`operation` text DEFAULT 'SAVE' NOT NULL,
	`changed_columns` text DEFAULT '[]' NOT NULL,
	`sync_revision` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_pending` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`sync_zone` text NOT NULL,
	`sync_id` text NOT NULL,
	`record_type` text NOT NULL,
	`missing_record_type` text NOT NULL,
	`missing_sync_id` text NOT NULL,
	`system_fields` text,
	`payload` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_record` (
	`sync_zone` text NOT NULL,
	`sync_id` text NOT NULL,
	`record_type` text NOT NULL,
	`system_fields` text,
	`payload` text,
	`schema_version` integer DEFAULT 1 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `sync_record_pk` PRIMARY KEY(`sync_zone`, `sync_id`)
);
--> statement-breakpoint
CREATE TABLE `sync_zone_registry` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`zone_label` text NOT NULL UNIQUE,
	`zone_name` text NOT NULL,
	`owner_name` text NOT NULL,
	`database_scope` text NOT NULL,
	`role` text NOT NULL,
	`share_record_name` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD `sync_id` text;--> statement-breakpoint
ALTER TABLE `accounts` ADD `sync_zone` text DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE `bank_integrations` ADD `sync_id` text;--> statement-breakpoint
ALTER TABLE `bank_integrations` ADD `sync_zone` text DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE `bank_integrations` ADD `owner_install_id` text;--> statement-breakpoint
ALTER TABLE `budget_category_limits` ADD `sync_id` text;--> statement-breakpoint
ALTER TABLE `budget_category_limits` ADD `sync_zone` text DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE `budgets` ADD `sync_id` text;--> statement-breakpoint
ALTER TABLE `budgets` ADD `sync_zone` text DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE `budget_limit_changes` ADD `sync_id` text;--> statement-breakpoint
ALTER TABLE `budget_limit_changes` ADD `sync_zone` text DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE `budget_sinking_funds` ADD `sync_id` text;--> statement-breakpoint
ALTER TABLE `budget_sinking_funds` ADD `sync_zone` text DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD `sync_id` text;--> statement-breakpoint
ALTER TABLE `categories` ADD `sync_zone` text DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE `debt_events` ADD `sync_id` text;--> statement-breakpoint
ALTER TABLE `debt_events` ADD `sync_zone` text DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE `recurring_series` ADD `sync_id` text;--> statement-breakpoint
ALTER TABLE `recurring_series` ADD `sync_zone` text DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE `rule_actions` ADD `sync_id` text;--> statement-breakpoint
ALTER TABLE `rule_actions` ADD `sync_zone` text DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE `rule_conditions` ADD `sync_id` text;--> statement-breakpoint
ALTER TABLE `rule_conditions` ADD `sync_zone` text DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE `rules` ADD `sync_id` text;--> statement-breakpoint
ALTER TABLE `rules` ADD `sync_zone` text DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `cloud_backup_enabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `last_cloud_backup_at` integer;--> statement-breakpoint
ALTER TABLE `settings` ADD `cloud_sync_enabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `lineage_id` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `household_share_everything` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tags` ADD `sync_id` text;--> statement-breakpoint
ALTER TABLE `tags` ADD `sync_zone` text DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` ADD `sync_id` text;--> statement-breakpoint
ALTER TABLE `transactions` ADD `sync_zone` text DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE `transaction_entries` ADD `sync_id` text;--> statement-breakpoint
ALTER TABLE `transaction_entries` ADD `sync_zone` text DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE `transaction_entries` ADD `sequence` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `transaction_receipts` ADD `sync_id` text;--> statement-breakpoint
ALTER TABLE `transaction_receipts` ADD `sync_zone` text DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE `transaction_tags` ADD `sync_id` text;--> statement-breakpoint
ALTER TABLE `transaction_tags` ADD `sync_zone` text DEFAULT 'personal' NOT NULL;--> statement-breakpoint
DROP INDEX IF EXISTS `transaction_receipts_fingerprint_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_sync_identity_unq` ON `accounts` (`sync_zone`,`sync_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `bank_integrations_sync_identity_unq` ON `bank_integrations` (`sync_zone`,`sync_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `budget_category_limits_sync_identity_unq` ON `budget_category_limits` (`sync_zone`,`sync_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `budgets_sync_identity_unq` ON `budgets` (`sync_zone`,`sync_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `budget_limit_changes_sync_identity_unq` ON `budget_limit_changes` (`sync_zone`,`sync_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `budget_sinking_funds_sync_identity_unq` ON `budget_sinking_funds` (`sync_zone`,`sync_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `categories_sync_identity_unq` ON `categories` (`sync_zone`,`sync_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `debt_events_sync_identity_unq` ON `debt_events` (`sync_zone`,`sync_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `recurring_series_sync_identity_unq` ON `recurring_series` (`sync_zone`,`sync_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `rule_actions_sync_identity_unq` ON `rule_actions` (`sync_zone`,`sync_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `rule_conditions_sync_identity_unq` ON `rule_conditions` (`sync_zone`,`sync_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `rules_sync_identity_unq` ON `rules` (`sync_zone`,`sync_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `sync_outbox_record_unq` ON `sync_outbox` (`sync_zone`,`sync_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `sync_pending_record_unq` ON `sync_pending` (`sync_zone`,`sync_id`);--> statement-breakpoint
CREATE INDEX `sync_pending_missing_idx` ON `sync_pending` (`sync_zone`,`missing_sync_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `tags_sync_identity_unq` ON `tags` (`sync_zone`,`sync_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_sync_identity_unq` ON `transactions` (`sync_zone`,`sync_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `transaction_entries_sync_identity_unq` ON `transaction_entries` (`sync_zone`,`sync_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `transaction_receipts_sync_identity_unq` ON `transaction_receipts` (`sync_zone`,`sync_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `transaction_receipts_zone_fingerprint_idx` ON `transaction_receipts` (`sync_zone`,`fingerprint`);--> statement-breakpoint
CREATE UNIQUE INDEX `transaction_tags_sync_identity_unq` ON `transaction_tags` (`sync_zone`,`sync_id`);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_account_external_ids` (
	`sync_id` text,
	`sync_zone` text DEFAULT 'personal' NOT NULL,
	`external_id` text NOT NULL,
	`account_id` integer NOT NULL,
	CONSTRAINT `account_external_ids_pk` PRIMARY KEY(`sync_zone`, `external_id`),
	CONSTRAINT `fk_account_external_ids_account_id_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_account_external_ids`(`external_id`, `account_id`) SELECT `external_id`, `account_id` FROM `account_external_ids`;--> statement-breakpoint
DROP TABLE `account_external_ids`;--> statement-breakpoint
ALTER TABLE `__new_account_external_ids` RENAME TO `account_external_ids`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `account_external_ids_sync_identity_unq` ON `account_external_ids` (`sync_zone`,`sync_id`);--> statement-breakpoint
CREATE INDEX `account_external_ids_account_idx` ON `account_external_ids` (`account_id`);
