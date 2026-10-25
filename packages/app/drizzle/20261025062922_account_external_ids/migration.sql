CREATE TABLE `account_external_ids` (
	`external_id` text PRIMARY KEY,
	`account_id` integer NOT NULL,
	CONSTRAINT `fk_account_external_ids_account_id_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `account_external_ids_account_idx` ON `account_external_ids` (`account_id`);