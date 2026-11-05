PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_account_external_ids` (
	`sync_id` text,
	`sync_zone` text DEFAULT 'personal' NOT NULL,
	`external_id` text NOT NULL,
	`account_id` integer NOT NULL,
	CONSTRAINT `account_external_ids_pk` PRIMARY KEY(`sync_zone`, `external_id`),
	CONSTRAINT `fk_account_external_ids_account_id_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_account_external_ids`(`sync_id`, `sync_zone`, `external_id`, `account_id`) SELECT `sync_id`, `sync_zone`, `external_id`, `account_id` FROM `account_external_ids`;--> statement-breakpoint
DROP TABLE `account_external_ids`;--> statement-breakpoint
ALTER TABLE `__new_account_external_ids` RENAME TO `account_external_ids`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `account_external_ids_sync_identity_unq` ON `account_external_ids` (`sync_zone`,`sync_id`);--> statement-breakpoint
CREATE INDEX `account_external_ids_account_idx` ON `account_external_ids` (`account_id`);