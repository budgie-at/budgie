CREATE TABLE `budget_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`name` text NOT NULL,
	`period` text NOT NULL,
	`period_start_day` integer DEFAULT 1 NOT NULL,
	`overall_limit` integer NOT NULL,
	`rollover_enabled` integer DEFAULT false NOT NULL,
	`rollover_deficit_enabled` integer DEFAULT false NOT NULL,
	`category_limits_json` text,
	`income_expectations_json` text
);
