DROP TRIGGER IF EXISTS `recurring_series_sync_outbox_insert`;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `recurring_series_sync_outbox_insert` AFTER INSERT ON `recurring_series`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    VALUES ('RecurringSeries', NEW.sync_zone, NEW.sync_id, 'SAVE', '["account_id","amount","anchor_date","cadence_interval","cadence_unit","category_id","confidence","created_at","deleted_at","ends_at","instrument_id","kind","last_seen_at","merchant_key","period_days","reminder_days_before","source","status","title","updated_at","user_state"]')
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
DROP TRIGGER IF EXISTS `recurring_series_sync_outbox_update`;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `recurring_series_sync_outbox_update` AFTER UPDATE ON `recurring_series`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'RecurringSeries', NEW.sync_zone, NEW.sync_id, 'SAVE', changed.names
    FROM (
        SELECT json_group_array(name) AS names FROM (
            SELECT name FROM (
            SELECT 'account_id' AS name WHERE OLD."account_id" IS NOT NEW."account_id"
            UNION ALL
            SELECT 'amount' AS name WHERE OLD."amount" IS NOT NEW."amount"
            UNION ALL
            SELECT 'anchor_date' AS name WHERE OLD."anchor_date" IS NOT NEW."anchor_date"
            UNION ALL
            SELECT 'cadence_interval' AS name WHERE OLD."cadence_interval" IS NOT NEW."cadence_interval"
            UNION ALL
            SELECT 'cadence_unit' AS name WHERE OLD."cadence_unit" IS NOT NEW."cadence_unit"
            UNION ALL
            SELECT 'category_id' AS name WHERE OLD."category_id" IS NOT NEW."category_id"
            UNION ALL
            SELECT 'confidence' AS name WHERE OLD."confidence" IS NOT NEW."confidence"
            UNION ALL
            SELECT 'created_at' AS name WHERE OLD."created_at" IS NOT NEW."created_at"
            UNION ALL
            SELECT 'deleted_at' AS name WHERE OLD."deleted_at" IS NOT NEW."deleted_at"
            UNION ALL
            SELECT 'ends_at' AS name WHERE OLD."ends_at" IS NOT NEW."ends_at"
            UNION ALL
            SELECT 'instrument_id' AS name WHERE OLD."instrument_id" IS NOT NEW."instrument_id"
            UNION ALL
            SELECT 'kind' AS name WHERE OLD."kind" IS NOT NEW."kind"
            UNION ALL
            SELECT 'last_seen_at' AS name WHERE OLD."last_seen_at" IS NOT NEW."last_seen_at"
            UNION ALL
            SELECT 'merchant_key' AS name WHERE OLD."merchant_key" IS NOT NEW."merchant_key"
            UNION ALL
            SELECT 'period_days' AS name WHERE OLD."period_days" IS NOT NEW."period_days"
            UNION ALL
            SELECT 'reminder_days_before' AS name WHERE OLD."reminder_days_before" IS NOT NEW."reminder_days_before"
            UNION ALL
            SELECT 'source' AS name WHERE OLD."source" IS NOT NEW."source"
            UNION ALL
            SELECT 'status' AS name WHERE OLD."status" IS NOT NEW."status"
            UNION ALL
            SELECT 'title' AS name WHERE OLD."title" IS NOT NEW."title"
            UNION ALL
            SELECT 'updated_at' AS name WHERE OLD."updated_at" IS NOT NEW."updated_at"
            UNION ALL
            SELECT 'user_state' AS name WHERE OLD."user_state" IS NOT NEW."user_state"
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
--> statement-breakpoint
DROP TRIGGER IF EXISTS `recurring_series_sync_outbox_delete`;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `recurring_series_sync_outbox_delete` AFTER DELETE ON `recurring_series`
WHEN OLD.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    VALUES ('RecurringSeries', OLD.sync_zone, OLD.sync_id, 'DELETE', '[]')
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
