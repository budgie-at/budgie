CREATE INDEX `sync_outbox_zone_id_idx` ON `sync_outbox` (`sync_zone`,`id`);--> statement-breakpoint
CREATE INDEX `sync_record_type_idx` ON `sync_record` (`record_type`);--> statement-breakpoint
CREATE INDEX `sync_record_updated_at_idx` ON `sync_record` (`updated_at`);--> statement-breakpoint
CREATE INDEX `transactions_sync_id_idx` ON `transactions` (`sync_id`);--> statement-breakpoint
CREATE INDEX `transactions_external_source_deleted_idx` ON `transactions` (`external_source`,`deleted_at`) WHERE "transactions"."external_source" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `transaction_entries_mcc_category_idx` ON `transaction_entries` (`mcc_category_id`) WHERE "transaction_entries"."mcc_category_id" IS NOT NULL AND "transaction_entries"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX `transaction_receipts_merchant_vat_idx` ON `transaction_receipts` (`merchant_vat_id`) WHERE "transaction_receipts"."merchant_vat_id" IS NOT NULL;