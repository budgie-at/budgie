CREATE TABLE `budgets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`name` text NOT NULL,
	`period` text NOT NULL,
	`period_start_day` integer NOT NULL,
	`use_last_day_of_month` integer NOT NULL,
	`overall_limit` integer NOT NULL,
	`other_limit` integer NOT NULL,
	`instrument_id` integer NOT NULL,
	FOREIGN KEY (`instrument_id`) REFERENCES `instruments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `budget_category_limits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`budget_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	`limit_amount` integer NOT NULL,
	FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `budget_category_limit_budget_category_unq` ON `budget_category_limits` (`budget_id`,`category_id`) WHERE `deleted_at` IS NULL;
--> statement-breakpoint
CREATE INDEX `budget_instrument_idx` ON `budgets` (`instrument_id`);
--> statement-breakpoint
ALTER TABLE `settings` ADD `is_budget_widget_enabled` integer NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `settings` ADD `is_budget_push_enabled` integer NOT NULL DEFAULT false;
