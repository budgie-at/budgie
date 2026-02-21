CREATE TABLE `comment_embeddings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`comment` text NOT NULL,
	`category_id` integer NOT NULL,
	`embedding` blob NOT NULL,
	`dimensions` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `comment_embeddings_comment_category_id_unique` ON `comment_embeddings` (`comment`,`category_id`);--> statement-breakpoint
CREATE TABLE `comment_embedding_tags` (
	`comment_embedding_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`comment_embedding_id`, `tag_id`),
	FOREIGN KEY (`comment_embedding_id`) REFERENCES `comment_embeddings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `merchant_embeddings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`title` text NOT NULL,
	`mcc_description` text DEFAULT '' NOT NULL,
	`category_id` integer NOT NULL,
	`comment` text DEFAULT '' NOT NULL,
	`embedding` blob NOT NULL,
	`dimensions` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `merchant_embeddings_title_mcc_description_category_id_unique` ON `merchant_embeddings` (`title`,`mcc_description`,`category_id`);--> statement-breakpoint
CREATE TABLE `merchant_embedding_tags` (
	`merchant_embedding_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`merchant_embedding_id`, `tag_id`),
	FOREIGN KEY (`merchant_embedding_id`) REFERENCES `merchant_embeddings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
