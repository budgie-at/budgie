CREATE TABLE `account_balances` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`account_id` integer NOT NULL,
	`amount` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_balances_account_id_unique` ON `account_balances` (`account_id`);--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`icon` text DEFAULT 'Home' NOT NULL,
	`parent_id` integer,
	`order` integer DEFAULT 0 NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`type` text DEFAULT 'CASH' NOT NULL,
	`nature` text DEFAULT 'LIABILITY' NOT NULL,
	`debt_type` text DEFAULT 'LENT' NOT NULL,
	`instrument_id` integer NOT NULL,
	`external_id` text,
	`contact_id` text,
	`deadline` integer,
	`target_balance` integer DEFAULT 0 NOT NULL,
	`external_source` text,
	`iban` text,
	`include_in_net_worth` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`instrument_id`) REFERENCES `instruments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`title` text DEFAULT '' NOT NULL,
	`icon` text NOT NULL,
	`parent_id` integer,
	`is_default` integer DEFAULT false NOT NULL,
	`is_system_category` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exchange_rates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`source` text,
	`base_instrument_id` integer NOT NULL,
	`quote_instrument_id` integer NOT NULL,
	`rate` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exchange_rates_base_instrument_id_quote_instrument_id_unique` ON `exchange_rates` (`base_instrument_id`,`quote_instrument_id`);--> statement-breakpoint
CREATE TABLE `instruments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`type` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`symbol` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`locale` text NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`default_account_id` integer,
	`default_instrument_id` integer,
	`theme` text DEFAULT 'SYSTEM' NOT NULL,
	`is_pin_enabled` integer DEFAULT false NOT NULL,
	`is_biometric_enabled` integer DEFAULT false NOT NULL,
	`show_cents` integer DEFAULT true NOT NULL,
	`is_vibration_enabled` integer DEFAULT true NOT NULL,
	`is_screenshot_protection_enabled` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`default_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`default_instrument_id`) REFERENCES `instruments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`title` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`external_id` text,
	`operated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`comment` text DEFAULT '' NOT NULL,
	`to_account_id` integer,
	`from_account_id` integer,
	`exchange_rate` real NOT NULL,
	`external_source` text,
	FOREIGN KEY (`to_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `transaction_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`type` text NOT NULL,
	`account_id` integer NOT NULL,
	`category_id` integer,
	`transaction_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`external_id` text,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `transaction_tags` (
	`transaction_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`transaction_id`, `tag_id`),
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
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
--> statement-breakpoint
-- Seed default settings
INSERT INTO `settings` (`locale`, `language`, `default_account_id`, `default_instrument_id`, `theme`, `show_cents`, `is_vibration_enabled`, `is_pin_enabled`, `is_biometric_enabled`) VALUES
    ('en-US', 'en', null, 1, 'SYSTEM', true, true, false, false);
--> statement-breakpoint
-- Seed default categories
INSERT INTO `categories` (`is_default`, `title`, `icon`, `parent_id`, `is_system_category`)
VALUES
    (true, 'Currency Purchase',          'ArrowRightLeft',       NULL, true),
    (true, 'Currency Sale',              'ArrowLeftRight',       NULL, true),
    (true, 'Crypto Purchase',            'Bitcoin',              NULL, true),
    (true, 'Crypto Sale',                'Coins',                NULL, true),
    (true, 'Stock Purchase',             'LineChart',            NULL, true),
    (true, 'Stock Sale',                 'CandlestickChart',     NULL, true),
    (true, 'Currency Transfer',          'ArrowLeftRight',       NULL, true),
    (true, 'Crypto Transfer',            'Send',                 NULL, true),
    (true, 'Stock Transfer',             'MoveHorizontal',       NULL, true),
    (true, 'Housing & Utilities',        'Home',                 NULL, false),
    (true, 'Groceries',                  'ShoppingBasket',       NULL, false),
    (true, 'Restaurants & Cafes',        'Utensils',             NULL, false),
    (true, 'Transportation',             'Bus',                  NULL, false),
    (true, 'Car & Fuel',                 'Car',                  NULL, false),
    (true, 'Health & Medical',           'HeartPulse',           NULL, false),
    (true, 'Insurance',                  'ShieldCheck',          NULL, false),
    (true, 'Debt Payments',              'CreditCard',           NULL, false),
    (true, 'Savings',                    'PiggyBank',            NULL, false),
    (true, 'Investments',                'TrendingUp',           NULL, false),
    (true, 'Salary & Wages',             'Banknote',             NULL, false),
    (true, 'Freelance & Side Hustle',    'Briefcase',            NULL, false),
    (true, 'Shopping',                   'ShoppingBag',          NULL, false),
    (true, 'Subscriptions',              'Repeat',               NULL, false),
    (true, 'Entertainment',              'Popcorn',              NULL, false),
    (true, 'Education',                  'GraduationCap',        NULL, false),
    (true, 'Gifts & Donations',          'Gift',                 NULL, false),
    (true, 'Family & Kids',              'Baby',                 NULL, false),
    (true, 'Pets',                       'PawPrint',             NULL, false),
    (true, 'Travel',                     'Plane',                NULL, false),
    (true, 'Business Expenses',          'Building2',            NULL, false),
    (true, 'Taxes',                      'FileText',             NULL, false),
    (true, 'Bank Fees & Charges',        'Landmark',             NULL, false),
    (true, 'Home Maintenance',           'Wrench',               NULL, false),
    (true, 'Personal Care',              'Sparkles',             NULL, false),
    (true, 'Electronics & Gadgets',      'Smartphone',           NULL, false),
    (true, 'Sport & Fitness',            'Dumbbell',             NULL, false),
    (true, 'Clothing & Accessories',     'Shirt',                NULL, false),
    (true, 'Other',                      'CircleDot',            NULL, false),
    (true, 'Emergency Fund',             'AlertTriangle',        NULL, false);
