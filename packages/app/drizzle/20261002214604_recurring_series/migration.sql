CREATE TABLE `recurring_series` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`merchant_key` text NOT NULL,
	`kind` text NOT NULL,
	`period_days` integer NOT NULL,
	`amount` integer NOT NULL,
	`status` text NOT NULL,
	`user_state` text NOT NULL,
	`title` text NOT NULL,
	`category_id` integer,
	`last_seen_at` integer NOT NULL,
	CONSTRAINT `fk_recurring_series_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
);
