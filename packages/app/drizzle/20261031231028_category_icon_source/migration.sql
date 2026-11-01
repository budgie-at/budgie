ALTER TABLE `categories` ADD `icon_source` text DEFAULT 'AUTO' NOT NULL;--> statement-breakpoint
UPDATE `categories`
SET `icon_source` = 'USER'
WHERE NOT (`icon` = 'Home' AND `is_default` = 0 AND `is_system_category` = 0 AND `updated_at` = `created_at`);
