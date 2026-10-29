ALTER TABLE `budget_category_limits` ADD `rollover_mode` text DEFAULT 'NONE' NOT NULL;--> statement-breakpoint
ALTER TABLE `budgets` ADD `other_rollover_mode` text DEFAULT 'NONE' NOT NULL;--> statement-breakpoint
ALTER TABLE `budget_period_category_snapshots` ADD `carried_in` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `budget_period_category_snapshots` ADD `rollover_mode` text DEFAULT 'NONE' NOT NULL;--> statement-breakpoint
ALTER TABLE `budget_period_snapshots` ADD `other_carried_in` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `budget_period_snapshots` ADD `other_rollover_mode` text DEFAULT 'NONE' NOT NULL;