CREATE TABLE `account_balances` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`deletedAt` integer,
	`parent_account_id` integer,
	`account_id` integer NOT NULL,
	`amount` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`deletedAt` integer,
	`icon` text NOT NULL,
	`parent_id` integer,
	`order` integer DEFAULT 0 NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`type` text NOT NULL,
	`nature` text NOT NULL,
	`instrument_id` integer NOT NULL,
	`current_balance` integer DEFAULT 0 NOT NULL,
	`external_id` text,
	`external_source` text,
	`include_in_net_worth` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`deletedAt` integer,
	`title` text DEFAULT '' NOT NULL,
	`icon` text NOT NULL,
	`parent_id` integer
);
--> statement-breakpoint
CREATE TABLE `exchange_rates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`deletedAt` integer,
	`source` text,
	`base_instrument_id` integer NOT NULL,
	`quote_instrument_id` integer NOT NULL,
	`rate` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exchange_rates_base_instrument_id_quote_instrument_id_unique` ON `exchange_rates` (`base_instrument_id`,`quote_instrument_id`);--> statement-breakpoint
CREATE TABLE `instruments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`deletedAt` integer,
	`type` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`symbol` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`deletedAt` integer,
	`locale` text NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`default_account_id` integer,
	`default_instrument_id` integer,
	`theme` text DEFAULT 'SYSTEM' NOT NULL,
	`show_cents` integer DEFAULT true NOT NULL,
	`is_vibration_enabled` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`default_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`default_instrument_id`) REFERENCES `instruments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`deletedAt` integer,
	`title` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transaction_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`deletedAt` integer,
	`type` text NOT NULL,
	`account_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	`parent_category_id` integer NOT NULL,
	`parent_account_id` integer,
	`instrument_id` integer NOT NULL,
	`transaction_id` integer NOT NULL,
	`amount` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transaction_tags` (
	`transaction_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`transaction_id`, `tag_id`)
);
--> statement-breakpoint
-- Seed common fiat currencies into instruments table
INSERT INTO `instruments` (`type`, `code`, `name`, `symbol`) VALUES
-- Major currencies
('FIAT', 'USD', 'United States Dollar', '$'),
('FIAT', 'EUR', 'Euro', '€'),
('FIAT', 'GBP', 'British Pound Sterling', '£'),
('FIAT', 'JPY', 'Japanese Yen', '¥'),
('FIAT', 'CHF', 'Swiss Franc', 'CHF'),
('FIAT', 'CAD', 'Canadian Dollar', 'C$'),
('FIAT', 'AUD', 'Australian Dollar', 'A$'),
('FIAT', 'NZD', 'New Zealand Dollar', 'NZ$'),
('FIAT', 'CNY', 'Chinese Yuan', '¥'),
('FIAT', 'INR', 'Indian Rupee', '₹'),
('FIAT', 'SEK', 'Swedish Krona', 'kr'),
('FIAT', 'NOK', 'Norwegian Krone', 'kr'),
('FIAT', 'DKK', 'Danish Krone', 'kr'),
('FIAT', 'SGD', 'Singapore Dollar', 'S$'),
('FIAT', 'HKD', 'Hong Kong Dollar', 'HK$'),
('FIAT', 'KRW', 'South Korean Won', '₩'),
('FIAT', 'MXN', 'Mexican Peso', 'MX$'),
('FIAT', 'BRL', 'Brazilian Real', 'R$'),
('FIAT', 'ZAR', 'South African Rand', 'R'),
('FIAT', 'RUB', 'Russian Ruble', '₽'),
('FIAT', 'TRY', 'Turkish Lira', '₺'),
('FIAT', 'PLN', 'Polish Złoty', 'zł'),
('FIAT', 'THB', 'Thai Baht', '฿'),
('FIAT', 'IDR', 'Indonesian Rupiah', 'Rp'),
('FIAT', 'MYR', 'Malaysian Ringgit', 'RM'),
('FIAT', 'PHP', 'Philippine Peso', '₱'),
('FIAT', 'CZK', 'Czech Koruna', 'Kč'),
('FIAT', 'ILS', 'Israeli New Shekel', '₪'),
('FIAT', 'CLP', 'Chilean Peso', 'CLP$'),
('FIAT', 'AED', 'United Arab Emirates Dirham', 'د.إ'),
('FIAT', 'SAR', 'Saudi Riyal', '﷼'),
('FIAT', 'ARS', 'Argentine Peso', 'ARS$'),
('FIAT', 'UAH', 'Ukrainian Hryvnia', '₴');
