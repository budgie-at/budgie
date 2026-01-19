CREATE TABLE `budget_alerts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`budget_id` integer NOT NULL,
	`category_id` integer,
	`type` text NOT NULL,
	`severity` text NOT NULL,
	`percentage` integer NOT NULL,
	`amount` integer,
	`transaction_id` integer,
	`dismissed_at` integer,
	`period_start` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `budget_alert_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`budget_id` integer NOT NULL,
	`warning_threshold` integer DEFAULT 80 NOT NULL,
	`exceeded_threshold` integer DEFAULT 100 NOT NULL,
	`large_expense_threshold` integer DEFAULT 10 NOT NULL,
	`pace_alerts_enabled` integer DEFAULT true NOT NULL,
	`predictive_alerts_enabled` integer DEFAULT true NOT NULL,
	`push_notifications_enabled` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `budget_alert_settings_budget_id_unique` ON `budget_alert_settings` (`budget_id`);