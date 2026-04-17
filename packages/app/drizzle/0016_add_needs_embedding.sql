ALTER TABLE `transactions` ADD `needs_embedding` integer DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE `transactions` SET `needs_embedding` = 1;
