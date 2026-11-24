DROP INDEX IF EXISTS `debt_events_transaction_idx`;--> statement-breakpoint
CREATE INDEX `accounts_external_source_id_idx` ON `accounts` (`external_source`,`external_id`) WHERE "accounts"."deleted_at" IS NULL AND "accounts"."external_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `accounts_integration_idx` ON `accounts` (`integration_id`) WHERE "accounts"."deleted_at" IS NULL AND "accounts"."integration_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `budget_limit_changes_budget_idx` ON `budget_limit_changes` (`budget_id`) WHERE "budget_limit_changes"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX `budget_sinking_funds_budget_idx` ON `budget_sinking_funds` (`budget_id`) WHERE "budget_sinking_funds"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX `instrument_daily_market_prices_inst_date_idx` ON `instrument_daily_market_prices` (`instrument_id`,"price_date" DESC) WHERE "instrument_daily_market_prices"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX `instruments_code_idx` ON `instruments` (`code`);--> statement-breakpoint
CREATE INDEX `instruments_provider_idx` ON `instruments` (`price_provider`,`provider_instrument_id`) WHERE "instruments"."provider_instrument_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `recurring_series_transaction_series_idx` ON `recurring_series_transaction` (`series_id`) WHERE "recurring_series_transaction"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX `rule_actions_rule_idx` ON `rule_actions` (`rule_id`) WHERE "rule_actions"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX `rule_conditions_rule_idx` ON `rule_conditions` (`rule_id`) WHERE "rule_conditions"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX `sync_record_sync_id_idx` ON `sync_record` (`sync_id`);--> statement-breakpoint
CREATE INDEX `transaction_entries_refund_tx_idx` ON `transaction_entries` (`transaction_id`,`type`,`amount`) WHERE "transaction_entries"."deleted_at" IS NULL AND "transaction_entries"."original_transaction_id" IS NOT NULL;