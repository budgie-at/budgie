CREATE TABLE `instrument_daily_market_prices` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
    `updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
    `deleted_at` integer,
    `instrument_id` integer NOT NULL,
    `quote_instrument_id` integer NOT NULL,
    `price_date` text NOT NULL,
    `price` real NOT NULL,
    `market_cap` real,
    `volume` real,
    `source` text NOT NULL,
    FOREIGN KEY (`instrument_id`) REFERENCES `instruments`(`id`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (`quote_instrument_id`) REFERENCES `instruments`(`id`) ON UPDATE no action ON DELETE cascade,
    UNIQUE(`instrument_id`, `quote_instrument_id`, `price_date`)
);
--> statement-breakpoint
CREATE INDEX `instrument_daily_market_prices_lookup_idx`
ON `instrument_daily_market_prices` (`instrument_id`, `quote_instrument_id`, `price_date` DESC)
WHERE `deleted_at` IS NULL;
--> statement-breakpoint
CREATE TABLE `instrument_market_data_jobs` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
    `updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
    `deleted_at` integer,
    `instrument_id` integer NOT NULL,
    `quote_instrument_id` integer NOT NULL,
    `from_date` text NOT NULL,
    `to_date` text NOT NULL,
    `status` text DEFAULT 'PENDING' NOT NULL,
    `priority` integer DEFAULT 0 NOT NULL,
    `attempts` integer DEFAULT 0 NOT NULL,
    `locked_at` integer,
    `completed_at` integer,
    `last_error` text,
    FOREIGN KEY (`instrument_id`) REFERENCES `instruments`(`id`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (`quote_instrument_id`) REFERENCES `instruments`(`id`) ON UPDATE no action ON DELETE cascade,
    UNIQUE(`instrument_id`, `quote_instrument_id`, `from_date`, `to_date`)
);
--> statement-breakpoint
CREATE INDEX `instrument_market_data_jobs_drain_idx`
ON `instrument_market_data_jobs` (`status`, `priority` DESC, `updated_at`)
WHERE `deleted_at` IS NULL;
--> statement-breakpoint
CREATE INDEX `instrument_market_data_jobs_lookup_idx`
ON `instrument_market_data_jobs` (`instrument_id`, `quote_instrument_id`, `status`)
WHERE `deleted_at` IS NULL;
