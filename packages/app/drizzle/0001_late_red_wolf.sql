CREATE TABLE `bank_syncs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`account_id` integer NOT NULL,
	`provider` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`mode` text DEFAULT 'BACKWARD' NOT NULL,
	`status` text DEFAULT 'IDLE' NOT NULL,
	`backward_synced_at` integer,
	`backward_sync_from_at` integer,
	`forward_synced_at` integer,
	`forward_sync_from_at` integer,
	`transaction_count` integer DEFAULT 0 NOT NULL,
	`error_count` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bank_syncs_account_id_unique` ON `bank_syncs` (`account_id`);