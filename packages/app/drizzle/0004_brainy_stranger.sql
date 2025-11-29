ALTER TABLE `categories` ADD `root_id` integer;--> statement-breakpoint
ALTER TABLE `transaction_entries` DROP COLUMN `parent_category_id`;