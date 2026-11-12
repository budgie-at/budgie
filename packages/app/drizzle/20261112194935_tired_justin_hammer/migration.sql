ALTER TABLE `instruments` ADD `quote_instrument_id` integer REFERENCES instruments(id);
--> statement-breakpoint
UPDATE instruments SET quote_instrument_id = (SELECT id FROM instruments WHERE code = 'UAH' LIMIT 1) WHERE price_provider = 'INZHUR';
