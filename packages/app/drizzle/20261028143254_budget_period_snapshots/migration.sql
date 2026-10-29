CREATE TABLE `budget_period_category_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`snapshot_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	`limit_amount` integer NOT NULL,
	`spent` integer NOT NULL,
	CONSTRAINT `fk_budget_period_category_snapshots_snapshot_id_budget_period_snapshots_id_fk` FOREIGN KEY (`snapshot_id`) REFERENCES `budget_period_snapshots`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_budget_period_category_snapshots_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `budget_period_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`budget_id` integer NOT NULL,
	`period_start` integer NOT NULL,
	`period_end` integer NOT NULL,
	`overall_limit` integer NOT NULL,
	`overall_spent` integer NOT NULL,
	`other_limit` integer NOT NULL,
	`other_spent` integer NOT NULL,
	`is_reconstructed` integer NOT NULL,
	`recap_seen_at` integer,
	CONSTRAINT `fk_budget_period_snapshots_budget_id_budgets_id_fk` FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX `budget_period_category_snapshot_snapshot_category_unq` ON `budget_period_category_snapshots` (`snapshot_id`,`category_id`) WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `budget_period_snapshot_budget_period_start_unq` ON `budget_period_snapshots` (`budget_id`,`period_start`) WHERE deleted_at IS NULL;