ALTER TABLE `budgets` ADD `rollover_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `budgets` ADD `rollover_deficit_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `budgets` ADD `rollover_amount` integer DEFAULT 0 NOT NULL;