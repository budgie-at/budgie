CREATE TABLE `budget_allocations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`budget_id` integer NOT NULL,
	`category_id` integer,
	`allocation_type` text DEFAULT 'FIXED' NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`percentage` real DEFAULT 0 NOT NULL,
	`rollover_rule` text DEFAULT 'NONE' NOT NULL,
	`rollover_cap` integer,
	`is_sinking_fund` integer DEFAULT false NOT NULL,
	`sinking_fund_target` integer,
	`sinking_fund_target_date` integer,
	`is_excluded` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `budget_allocation_instances` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`budget_instance_id` integer NOT NULL,
	`budget_allocation_id` integer NOT NULL,
	`category_id` integer,
	`planned` integer DEFAULT 0 NOT NULL,
	`actual` integer DEFAULT 0 NOT NULL,
	`forecast` integer DEFAULT 0 NOT NULL,
	`rollover_in` integer DEFAULT 0 NOT NULL,
	`rollover_out` integer DEFAULT 0 NOT NULL,
	`adjustment` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`budget_instance_id`) REFERENCES `budget_instances`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`budget_allocation_id`) REFERENCES `budget_allocations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`title` text NOT NULL,
	`period` text DEFAULT 'MONTHLY' NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`start_day` integer DEFAULT 1 NOT NULL,
	`instrument_id` integer NOT NULL,
	`is_template` integer DEFAULT false NOT NULL,
	`exclude_transfers` integer DEFAULT true NOT NULL,
	`exclude_pending` integer DEFAULT true NOT NULL,
	`alert_threshold_80` integer DEFAULT true NOT NULL,
	`alert_threshold_100` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`instrument_id`) REFERENCES `instruments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `budget_instances` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`budget_id` integer NOT NULL,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`total_planned` integer DEFAULT 0 NOT NULL,
	`total_actual` integer DEFAULT 0 NOT NULL,
	`total_forecast` integer DEFAULT 0 NOT NULL,
	`exchange_rate` real DEFAULT 1 NOT NULL,
	`income_actual` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON UPDATE no action ON DELETE cascade
);
