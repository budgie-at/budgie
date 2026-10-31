CREATE TABLE `budget_limit_changes` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`budget_id` integer NOT NULL,
	`category_id` integer,
	`previous_amount` integer NOT NULL,
	`new_amount` integer NOT NULL,
	`reason` text NOT NULL,
	`periods_observed` integer NOT NULL,
	`period_start` integer NOT NULL,
	CONSTRAINT `fk_budget_limit_changes_budget_id_budgets_id_fk` FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_budget_limit_changes_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `budget_sinking_funds` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`budget_id` integer NOT NULL,
	`name` text NOT NULL,
	`category_id` integer NOT NULL,
	`target_amount` integer NOT NULL,
	`due_at` integer NOT NULL,
	`repeat_every_months` integer,
	`recurring_series_id` integer,
	`funded_amount` integer DEFAULT 0 NOT NULL,
	`last_funded_period_start` integer,
	CONSTRAINT `fk_budget_sinking_funds_budget_id_budgets_id_fk` FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_budget_sinking_funds_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_budget_sinking_funds_recurring_series_id_recurring_series_id_fk` FOREIGN KEY (`recurring_series_id`) REFERENCES `recurring_series`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
ALTER TABLE `budget_category_limits` ADD `user_edited_at` integer;--> statement-breakpoint
ALTER TABLE `budgets` ADD `kind` text DEFAULT 'MAIN' NOT NULL;--> statement-breakpoint
ALTER TABLE `budgets` ADD `period_anchor_date` integer;--> statement-breakpoint
ALTER TABLE `budgets` ADD `other_limit_user_edited_at` integer;--> statement-breakpoint
ALTER TABLE `budgets` ADD `limit_source` text DEFAULT 'FIXED' NOT NULL;--> statement-breakpoint
ALTER TABLE `budgets` ADD `is_auto_tune_enabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `budgets` ADD `tag_id` integer REFERENCES tags(id) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE `budgets` ADD `starts_at` integer;--> statement-breakpoint
ALTER TABLE `budgets` ADD `ends_at` integer;--> statement-breakpoint
ALTER TABLE `budget_period_category_snapshots` ADD `fund_covered` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `budget_period_snapshots` ADD `other_fund_covered` integer DEFAULT 0 NOT NULL;