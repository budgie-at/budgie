CREATE TABLE `budgets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`name` text NOT NULL,
	`period` text NOT NULL,
	`period_start_day` integer DEFAULT 1 NOT NULL,
	`use_last_day_of_month` integer DEFAULT false NOT NULL,
	`overall_limit` integer NOT NULL
);
