CREATE TABLE `mcc_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`mcc` text NOT NULL,
	`mcc_group_id` integer NOT NULL,
	`short_description` text NOT NULL,
	`full_description` text NOT NULL,
	FOREIGN KEY (`mcc_group_id`) REFERENCES `mcc_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mcc_categories_mcc_unique` ON `mcc_categories` (`mcc`);--> statement-breakpoint
CREATE TABLE `mcc_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`type` text NOT NULL,
	`description` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mcc_groups_type_unique` ON `mcc_groups` (`type`);