ALTER TABLE `bank_syncs` ADD `backward_completed_at` integer;
--> statement-breakpoint
UPDATE `bank_syncs` SET `backward_completed_at` = `backward_synced_at` WHERE `backward_synced_at` IS NOT NULL;
--> statement-breakpoint
UPDATE `bank_syncs` SET `backward_synced_at` = NULL;
