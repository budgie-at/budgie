ALTER TABLE `accounts` ADD `dividend_payout` text;--> statement-breakpoint
INSERT INTO `instruments` (`type`, `code`, `name`, `symbol`, `price_provider`, `provider_instrument_id`)
SELECT 'FUND', 'UA5000014044', 'Inzhur REIT', 'REIT', 'INZHUR', 'UA5000014044'
WHERE NOT EXISTS (SELECT 1 FROM `instruments` WHERE `code` = 'UA5000014044');--> statement-breakpoint
INSERT INTO `instruments` (`type`, `code`, `name`, `symbol`, `price_provider`, `provider_instrument_id`)
SELECT 'FUND', 'UA5000012246', 'Inzhur Energy', 'ENERGY', 'INZHUR', 'UA5000012246'
WHERE NOT EXISTS (SELECT 1 FROM `instruments` WHERE `code` = 'UA5000012246');
