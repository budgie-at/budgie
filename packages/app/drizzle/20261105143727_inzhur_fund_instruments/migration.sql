ALTER TABLE `accounts` ADD `dividend_payout` text;--> statement-breakpoint
ALTER TABLE `transactions` ADD `fund_account_id` integer REFERENCES accounts(id) ON DELETE SET NULL;--> statement-breakpoint
INSERT INTO `instruments` (`type`, `code`, `name`, `symbol`, `price_provider`, `provider_instrument_id`)
SELECT 'FUND', 'UA5000014044', 'Inzhur REIT', 'REIT', 'INZHUR', 'UA5000014044'
WHERE NOT EXISTS (SELECT 1 FROM `instruments` WHERE `code` = 'UA5000014044');--> statement-breakpoint
INSERT INTO `instruments` (`type`, `code`, `name`, `symbol`, `price_provider`, `provider_instrument_id`)
SELECT 'FUND', 'UA5000012246', 'Inzhur Energy', 'ENERGY', 'INZHUR', 'UA5000012246'
WHERE NOT EXISTS (SELECT 1 FROM `instruments` WHERE `code` = 'UA5000012246');
