ALTER TABLE `accounts` ADD `return_at` integer;--> statement-breakpoint
ALTER TABLE `accounts` ADD `amount_to_return` integer DEFAULT 0 NOT NULL;