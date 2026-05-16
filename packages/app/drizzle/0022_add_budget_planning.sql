CREATE TABLE `budgets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`name` text NOT NULL,
	`period` text NOT NULL,
	`period_start_day` integer DEFAULT 1 NOT NULL,
	`use_last_day_of_month` integer DEFAULT false NOT NULL,
	`overall_limit` integer NOT NULL,
	`push_enabled` integer DEFAULT 0 NOT NULL
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
CREATE UNIQUE INDEX `budget_category_limit_budget_category_unq` ON `budget_category_limits` (`budget_id`,`category_id`);
--> statement-breakpoint
CREATE TABLE `budget_alert` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`budget_id` integer NOT NULL,
	`period_start` integer NOT NULL,
	`scope` text NOT NULL,
	`category_id` integer,
	`threshold` integer NOT NULL,
	`dismissed_at` integer,
	FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	CHECK ((`scope` = 'OVERALL' AND `category_id` IS NULL) OR (`scope` = 'CATEGORY' AND `category_id` IS NOT NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `budget_alert_overall_unique` ON `budget_alert` (`budget_id`,`period_start`,`threshold`) WHERE `scope` = 'OVERALL';
--> statement-breakpoint
CREATE UNIQUE INDEX `budget_alert_category_unique` ON `budget_alert` (`budget_id`,`period_start`,`threshold`,`category_id`) WHERE `scope` = 'CATEGORY';
--> statement-breakpoint
ALTER TABLE `settings` ADD `is_budget_widget_enabled` integer NOT NULL DEFAULT false;
