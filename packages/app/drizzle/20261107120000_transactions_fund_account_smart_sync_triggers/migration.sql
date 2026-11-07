DROP TRIGGER IF EXISTS `transactions_sync_outbox_insert`;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `transactions_sync_outbox_insert` AFTER INSERT ON `transactions`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    VALUES ('Transaction', NEW.sync_zone, NEW.sync_id, 'SAVE', '["comment","consolidation_parent_transaction_id","consolidation_type","created_at","deleted_at","exchange_rate","external_id","external_source","from_account_id","fund_account_id","import_fingerprint","operated_at","title","to_account_id","type","updated_at","updated_by"]')
    ON CONFLICT (sync_zone, sync_id) DO UPDATE SET
        operation = excluded.operation,
        changed_columns = CASE WHEN excluded.operation = 'DELETE' THEN '[]' ELSE (
            SELECT json_group_array(value) FROM (
                SELECT value FROM json_each(sync_outbox.changed_columns)
                UNION
                SELECT value FROM json_each(excluded.changed_columns)
                ORDER BY value
            )
        ) END,
        sync_revision = sync_outbox.sync_revision + 1;
END;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `transactions_sync_outbox_update`;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `transactions_sync_outbox_update` AFTER UPDATE ON `transactions`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Transaction', NEW.sync_zone, NEW.sync_id, 'SAVE', changed.names
    FROM (
        SELECT json_group_array(name) AS names FROM (
            SELECT name FROM (
            SELECT 'comment' AS name WHERE OLD."comment" IS NOT NEW."comment"
            UNION ALL
            SELECT 'consolidation_parent_transaction_id' AS name WHERE OLD."consolidation_parent_transaction_id" IS NOT NEW."consolidation_parent_transaction_id"
            UNION ALL
            SELECT 'consolidation_type' AS name WHERE OLD."consolidation_type" IS NOT NEW."consolidation_type"
            UNION ALL
            SELECT 'created_at' AS name WHERE OLD."created_at" IS NOT NEW."created_at"
            UNION ALL
            SELECT 'deleted_at' AS name WHERE OLD."deleted_at" IS NOT NEW."deleted_at"
            UNION ALL
            SELECT 'exchange_rate' AS name WHERE OLD."exchange_rate" IS NOT NEW."exchange_rate"
            UNION ALL
            SELECT 'external_id' AS name WHERE OLD."external_id" IS NOT NEW."external_id"
            UNION ALL
            SELECT 'external_source' AS name WHERE OLD."external_source" IS NOT NEW."external_source"
            UNION ALL
            SELECT 'from_account_id' AS name WHERE OLD."from_account_id" IS NOT NEW."from_account_id"
            UNION ALL
            SELECT 'fund_account_id' AS name WHERE OLD."fund_account_id" IS NOT NEW."fund_account_id"
            UNION ALL
            SELECT 'import_fingerprint' AS name WHERE OLD."import_fingerprint" IS NOT NEW."import_fingerprint"
            UNION ALL
            SELECT 'operated_at' AS name WHERE OLD."operated_at" IS NOT NEW."operated_at"
            UNION ALL
            SELECT 'title' AS name WHERE OLD."title" IS NOT NEW."title"
            UNION ALL
            SELECT 'to_account_id' AS name WHERE OLD."to_account_id" IS NOT NEW."to_account_id"
            UNION ALL
            SELECT 'type' AS name WHERE OLD."type" IS NOT NEW."type"
            UNION ALL
            SELECT 'updated_at' AS name WHERE OLD."updated_at" IS NOT NEW."updated_at"
            UNION ALL
            SELECT 'updated_by' AS name WHERE OLD."updated_by" IS NOT NEW."updated_by"
            ) ORDER BY name
        )
    ) AS changed
    WHERE changed.names <> '[]'
    ON CONFLICT (sync_zone, sync_id) DO UPDATE SET
        operation = excluded.operation,
        changed_columns = CASE WHEN excluded.operation = 'DELETE' THEN '[]' ELSE (
            SELECT json_group_array(value) FROM (
                SELECT value FROM json_each(sync_outbox.changed_columns)
                UNION
                SELECT value FROM json_each(excluded.changed_columns)
                ORDER BY value
            )
        ) END,
        sync_revision = sync_outbox.sync_revision + 1;
END;
