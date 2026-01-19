CREATE TABLE `budget_period_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`budget_id` integer NOT NULL,
	`period_start` integer NOT NULL,
	`period_end` integer NOT NULL,
	`overall_limit` integer NOT NULL,
	`total_spent` integer NOT NULL,
	`total_expected_income` integer NOT NULL,
	`total_actual_income` integer NOT NULL,
	`category_limits_json` text,
	`income_expectations_json` text,
	FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON UPDATE no action ON DELETE cascade
);
