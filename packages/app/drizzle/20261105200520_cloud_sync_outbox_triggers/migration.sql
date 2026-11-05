CREATE TRIGGER IF NOT EXISTS `accounts_sync_outbox_insert` AFTER INSERT ON `accounts`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    VALUES ('Account', NEW.sync_zone, NEW.sync_id, 'SAVE', '["created_at","deadline","debt_type","deleted_at","external_id","external_source","iban","icon","include_in_net_worth","installment_count","instrument_id","integration_id","interest_rate","is_active","is_external","nature","order","parent_id","target_balance","target_base_amount","target_base_exchange_rate","target_base_instrument_id","title","type","updated_at"]')
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
CREATE TRIGGER IF NOT EXISTS `accounts_sync_outbox_update` AFTER UPDATE ON `accounts`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Account', NEW.sync_zone, NEW.sync_id, 'SAVE', changed.names
    FROM (
        SELECT json_group_array(name) AS names FROM (
            SELECT name FROM (
            SELECT 'created_at' AS name WHERE OLD."created_at" IS NOT NEW."created_at"
            UNION ALL
            SELECT 'deadline' AS name WHERE OLD."deadline" IS NOT NEW."deadline"
            UNION ALL
            SELECT 'debt_type' AS name WHERE OLD."debt_type" IS NOT NEW."debt_type"
            UNION ALL
            SELECT 'deleted_at' AS name WHERE OLD."deleted_at" IS NOT NEW."deleted_at"
            UNION ALL
            SELECT 'external_id' AS name WHERE OLD."external_id" IS NOT NEW."external_id"
            UNION ALL
            SELECT 'external_source' AS name WHERE OLD."external_source" IS NOT NEW."external_source"
            UNION ALL
            SELECT 'iban' AS name WHERE OLD."iban" IS NOT NEW."iban"
            UNION ALL
            SELECT 'icon' AS name WHERE OLD."icon" IS NOT NEW."icon"
            UNION ALL
            SELECT 'include_in_net_worth' AS name WHERE OLD."include_in_net_worth" IS NOT NEW."include_in_net_worth"
            UNION ALL
            SELECT 'installment_count' AS name WHERE OLD."installment_count" IS NOT NEW."installment_count"
            UNION ALL
            SELECT 'instrument_id' AS name WHERE OLD."instrument_id" IS NOT NEW."instrument_id"
            UNION ALL
            SELECT 'integration_id' AS name WHERE OLD."integration_id" IS NOT NEW."integration_id"
            UNION ALL
            SELECT 'interest_rate' AS name WHERE OLD."interest_rate" IS NOT NEW."interest_rate"
            UNION ALL
            SELECT 'is_active' AS name WHERE OLD."is_active" IS NOT NEW."is_active"
            UNION ALL
            SELECT 'is_external' AS name WHERE OLD."is_external" IS NOT NEW."is_external"
            UNION ALL
            SELECT 'nature' AS name WHERE OLD."nature" IS NOT NEW."nature"
            UNION ALL
            SELECT 'order' AS name WHERE OLD."order" IS NOT NEW."order"
            UNION ALL
            SELECT 'parent_id' AS name WHERE OLD."parent_id" IS NOT NEW."parent_id"
            UNION ALL
            SELECT 'target_balance' AS name WHERE OLD."target_balance" IS NOT NEW."target_balance"
            UNION ALL
            SELECT 'target_base_amount' AS name WHERE OLD."target_base_amount" IS NOT NEW."target_base_amount"
            UNION ALL
            SELECT 'target_base_exchange_rate' AS name WHERE OLD."target_base_exchange_rate" IS NOT NEW."target_base_exchange_rate"
            UNION ALL
            SELECT 'target_base_instrument_id' AS name WHERE OLD."target_base_instrument_id" IS NOT NEW."target_base_instrument_id"
            UNION ALL
            SELECT 'title' AS name WHERE OLD."title" IS NOT NEW."title"
            UNION ALL
            SELECT 'type' AS name WHERE OLD."type" IS NOT NEW."type"
            UNION ALL
            SELECT 'updated_at' AS name WHERE OLD."updated_at" IS NOT NEW."updated_at"
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
CREATE TRIGGER IF NOT EXISTS `accounts_sync_outbox_delete` AFTER DELETE ON `accounts`
WHEN OLD.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    VALUES ('Account', OLD.sync_zone, OLD.sync_id, 'DELETE', '[]')
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
CREATE TRIGGER IF NOT EXISTS `bank_integrations_sync_outbox_insert` AFTER INSERT ON `bank_integrations`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    VALUES ('BankIntegration', NEW.sync_zone, NEW.sync_id, 'SAVE', '["created_at","deleted_at","external_client_id","label","owner_install_id","provider","updated_at"]')
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
CREATE TRIGGER IF NOT EXISTS `bank_integrations_sync_outbox_update` AFTER UPDATE ON `bank_integrations`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'BankIntegration', NEW.sync_zone, NEW.sync_id, 'SAVE', changed.names
    FROM (
        SELECT json_group_array(name) AS names FROM (
            SELECT name FROM (
            SELECT 'created_at' AS name WHERE OLD."created_at" IS NOT NEW."created_at"
            UNION ALL
            SELECT 'deleted_at' AS name WHERE OLD."deleted_at" IS NOT NEW."deleted_at"
            UNION ALL
            SELECT 'external_client_id' AS name WHERE OLD."external_client_id" IS NOT NEW."external_client_id"
            UNION ALL
            SELECT 'label' AS name WHERE OLD."label" IS NOT NEW."label"
            UNION ALL
            SELECT 'owner_install_id' AS name WHERE OLD."owner_install_id" IS NOT NEW."owner_install_id"
            UNION ALL
            SELECT 'provider' AS name WHERE OLD."provider" IS NOT NEW."provider"
            UNION ALL
            SELECT 'updated_at' AS name WHERE OLD."updated_at" IS NOT NEW."updated_at"
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
CREATE TRIGGER IF NOT EXISTS `bank_integrations_sync_outbox_delete` AFTER DELETE ON `bank_integrations`
WHEN OLD.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    VALUES ('BankIntegration', OLD.sync_zone, OLD.sync_id, 'DELETE', '[]')
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
CREATE TRIGGER IF NOT EXISTS `budgets_sync_outbox_insert` AFTER INSERT ON `budgets`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    VALUES ('Budget', NEW.sync_zone, NEW.sync_id, 'SAVE', '["created_at","deleted_at","ends_at","instrument_id","is_auto_tune_enabled","kind","limit_source","name","other_limit","other_limit_user_edited_at","other_rollover_mode","overall_limit","period","period_anchor_date","period_start_day","starts_at","tag_id","updated_at","use_last_day_of_month"]')
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
CREATE TRIGGER IF NOT EXISTS `budgets_sync_outbox_update` AFTER UPDATE ON `budgets`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Budget', NEW.sync_zone, NEW.sync_id, 'SAVE', changed.names
    FROM (
        SELECT json_group_array(name) AS names FROM (
            SELECT name FROM (
            SELECT 'created_at' AS name WHERE OLD."created_at" IS NOT NEW."created_at"
            UNION ALL
            SELECT 'deleted_at' AS name WHERE OLD."deleted_at" IS NOT NEW."deleted_at"
            UNION ALL
            SELECT 'ends_at' AS name WHERE OLD."ends_at" IS NOT NEW."ends_at"
            UNION ALL
            SELECT 'instrument_id' AS name WHERE OLD."instrument_id" IS NOT NEW."instrument_id"
            UNION ALL
            SELECT 'is_auto_tune_enabled' AS name WHERE OLD."is_auto_tune_enabled" IS NOT NEW."is_auto_tune_enabled"
            UNION ALL
            SELECT 'kind' AS name WHERE OLD."kind" IS NOT NEW."kind"
            UNION ALL
            SELECT 'limit_source' AS name WHERE OLD."limit_source" IS NOT NEW."limit_source"
            UNION ALL
            SELECT 'name' AS name WHERE OLD."name" IS NOT NEW."name"
            UNION ALL
            SELECT 'other_limit' AS name WHERE OLD."other_limit" IS NOT NEW."other_limit"
            UNION ALL
            SELECT 'other_limit_user_edited_at' AS name WHERE OLD."other_limit_user_edited_at" IS NOT NEW."other_limit_user_edited_at"
            UNION ALL
            SELECT 'other_rollover_mode' AS name WHERE OLD."other_rollover_mode" IS NOT NEW."other_rollover_mode"
            UNION ALL
            SELECT 'overall_limit' AS name WHERE OLD."overall_limit" IS NOT NEW."overall_limit"
            UNION ALL
            SELECT 'period' AS name WHERE OLD."period" IS NOT NEW."period"
            UNION ALL
            SELECT 'period_anchor_date' AS name WHERE OLD."period_anchor_date" IS NOT NEW."period_anchor_date"
            UNION ALL
            SELECT 'period_start_day' AS name WHERE OLD."period_start_day" IS NOT NEW."period_start_day"
            UNION ALL
            SELECT 'starts_at' AS name WHERE OLD."starts_at" IS NOT NEW."starts_at"
            UNION ALL
            SELECT 'tag_id' AS name WHERE OLD."tag_id" IS NOT NEW."tag_id"
            UNION ALL
            SELECT 'updated_at' AS name WHERE OLD."updated_at" IS NOT NEW."updated_at"
            UNION ALL
            SELECT 'use_last_day_of_month' AS name WHERE OLD."use_last_day_of_month" IS NOT NEW."use_last_day_of_month"
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
CREATE TRIGGER IF NOT EXISTS `budgets_sync_outbox_delete` AFTER DELETE ON `budgets`
WHEN OLD.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    VALUES ('Budget', OLD.sync_zone, OLD.sync_id, 'DELETE', '[]')
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
CREATE TRIGGER IF NOT EXISTS `categories_sync_outbox_insert` AFTER INSERT ON `categories`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    VALUES ('Category', NEW.sync_zone, NEW.sync_id, 'SAVE', '["created_at","deleted_at","icon","icon_source","is_default","is_system_category","parent_id","title","updated_at"]')
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
CREATE TRIGGER IF NOT EXISTS `categories_sync_outbox_update` AFTER UPDATE ON `categories`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Category', NEW.sync_zone, NEW.sync_id, 'SAVE', changed.names
    FROM (
        SELECT json_group_array(name) AS names FROM (
            SELECT name FROM (
            SELECT 'created_at' AS name WHERE OLD."created_at" IS NOT NEW."created_at"
            UNION ALL
            SELECT 'deleted_at' AS name WHERE OLD."deleted_at" IS NOT NEW."deleted_at"
            UNION ALL
            SELECT 'icon' AS name WHERE OLD."icon" IS NOT NEW."icon"
            UNION ALL
            SELECT 'icon_source' AS name WHERE OLD."icon_source" IS NOT NEW."icon_source"
            UNION ALL
            SELECT 'is_default' AS name WHERE OLD."is_default" IS NOT NEW."is_default"
            UNION ALL
            SELECT 'is_system_category' AS name WHERE OLD."is_system_category" IS NOT NEW."is_system_category"
            UNION ALL
            SELECT 'parent_id' AS name WHERE OLD."parent_id" IS NOT NEW."parent_id"
            UNION ALL
            SELECT 'title' AS name WHERE OLD."title" IS NOT NEW."title"
            UNION ALL
            SELECT 'updated_at' AS name WHERE OLD."updated_at" IS NOT NEW."updated_at"
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
CREATE TRIGGER IF NOT EXISTS `categories_sync_outbox_delete` AFTER DELETE ON `categories`
WHEN OLD.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    VALUES ('Category', OLD.sync_zone, OLD.sync_id, 'DELETE', '[]')
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
CREATE TRIGGER IF NOT EXISTS `debt_events_sync_outbox_insert` AFTER INSERT ON `debt_events`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    VALUES ('DebtEvent', NEW.sync_zone, NEW.sync_id, 'SAVE', '["amount","base_amount","base_exchange_rate","base_instrument_id","created_at","debt_account_id","deleted_at","direction","operated_at","source","transaction_entry_id","transaction_id","updated_at"]')
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
CREATE TRIGGER IF NOT EXISTS `debt_events_sync_outbox_update` AFTER UPDATE ON `debt_events`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'DebtEvent', NEW.sync_zone, NEW.sync_id, 'SAVE', changed.names
    FROM (
        SELECT json_group_array(name) AS names FROM (
            SELECT name FROM (
            SELECT 'amount' AS name WHERE OLD."amount" IS NOT NEW."amount"
            UNION ALL
            SELECT 'base_amount' AS name WHERE OLD."base_amount" IS NOT NEW."base_amount"
            UNION ALL
            SELECT 'base_exchange_rate' AS name WHERE OLD."base_exchange_rate" IS NOT NEW."base_exchange_rate"
            UNION ALL
            SELECT 'base_instrument_id' AS name WHERE OLD."base_instrument_id" IS NOT NEW."base_instrument_id"
            UNION ALL
            SELECT 'created_at' AS name WHERE OLD."created_at" IS NOT NEW."created_at"
            UNION ALL
            SELECT 'debt_account_id' AS name WHERE OLD."debt_account_id" IS NOT NEW."debt_account_id"
            UNION ALL
            SELECT 'deleted_at' AS name WHERE OLD."deleted_at" IS NOT NEW."deleted_at"
            UNION ALL
            SELECT 'direction' AS name WHERE OLD."direction" IS NOT NEW."direction"
            UNION ALL
            SELECT 'operated_at' AS name WHERE OLD."operated_at" IS NOT NEW."operated_at"
            UNION ALL
            SELECT 'source' AS name WHERE OLD."source" IS NOT NEW."source"
            UNION ALL
            SELECT 'transaction_entry_id' AS name WHERE OLD."transaction_entry_id" IS NOT NEW."transaction_entry_id"
            UNION ALL
            SELECT 'transaction_id' AS name WHERE OLD."transaction_id" IS NOT NEW."transaction_id"
            UNION ALL
            SELECT 'updated_at' AS name WHERE OLD."updated_at" IS NOT NEW."updated_at"
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
CREATE TRIGGER IF NOT EXISTS `debt_events_sync_outbox_delete` AFTER DELETE ON `debt_events`
WHEN OLD.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    VALUES ('DebtEvent', OLD.sync_zone, OLD.sync_id, 'DELETE', '[]')
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
CREATE TRIGGER IF NOT EXISTS `recurring_series_sync_outbox_insert` AFTER INSERT ON `recurring_series`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    VALUES ('RecurringSeries', NEW.sync_zone, NEW.sync_id, 'SAVE', '["amount","category_id","created_at","deleted_at","kind","last_seen_at","merchant_key","period_days","status","title","updated_at","user_state"]')
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
CREATE TRIGGER IF NOT EXISTS `recurring_series_sync_outbox_update` AFTER UPDATE ON `recurring_series`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'RecurringSeries', NEW.sync_zone, NEW.sync_id, 'SAVE', changed.names
    FROM (
        SELECT json_group_array(name) AS names FROM (
            SELECT name FROM (
            SELECT 'amount' AS name WHERE OLD."amount" IS NOT NEW."amount"
            UNION ALL
            SELECT 'category_id' AS name WHERE OLD."category_id" IS NOT NEW."category_id"
            UNION ALL
            SELECT 'created_at' AS name WHERE OLD."created_at" IS NOT NEW."created_at"
            UNION ALL
            SELECT 'deleted_at' AS name WHERE OLD."deleted_at" IS NOT NEW."deleted_at"
            UNION ALL
            SELECT 'kind' AS name WHERE OLD."kind" IS NOT NEW."kind"
            UNION ALL
            SELECT 'last_seen_at' AS name WHERE OLD."last_seen_at" IS NOT NEW."last_seen_at"
            UNION ALL
            SELECT 'merchant_key' AS name WHERE OLD."merchant_key" IS NOT NEW."merchant_key"
            UNION ALL
            SELECT 'period_days' AS name WHERE OLD."period_days" IS NOT NEW."period_days"
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
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `rules_sync_outbox_insert` AFTER INSERT ON `rules`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    VALUES ('Rule', NEW.sync_zone, NEW.sync_id, 'SAVE', '["condition_match_type","created_at","deleted_at","enabled","updated_at"]')
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
CREATE TRIGGER IF NOT EXISTS `rules_sync_outbox_update` AFTER UPDATE ON `rules`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Rule', NEW.sync_zone, NEW.sync_id, 'SAVE', changed.names
    FROM (
        SELECT json_group_array(name) AS names FROM (
            SELECT name FROM (
            SELECT 'condition_match_type' AS name WHERE OLD."condition_match_type" IS NOT NEW."condition_match_type"
            UNION ALL
            SELECT 'created_at' AS name WHERE OLD."created_at" IS NOT NEW."created_at"
            UNION ALL
            SELECT 'deleted_at' AS name WHERE OLD."deleted_at" IS NOT NEW."deleted_at"
            UNION ALL
            SELECT 'enabled' AS name WHERE OLD."enabled" IS NOT NEW."enabled"
            UNION ALL
            SELECT 'updated_at' AS name WHERE OLD."updated_at" IS NOT NEW."updated_at"
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
CREATE TRIGGER IF NOT EXISTS `rules_sync_outbox_delete` AFTER DELETE ON `rules`
WHEN OLD.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    VALUES ('Rule', OLD.sync_zone, OLD.sync_id, 'DELETE', '[]')
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
CREATE TRIGGER IF NOT EXISTS `tags_sync_outbox_insert` AFTER INSERT ON `tags`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    VALUES ('Tag', NEW.sync_zone, NEW.sync_id, 'SAVE', '["created_at","deleted_at","title","updated_at"]')
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
CREATE TRIGGER IF NOT EXISTS `tags_sync_outbox_update` AFTER UPDATE ON `tags`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Tag', NEW.sync_zone, NEW.sync_id, 'SAVE', changed.names
    FROM (
        SELECT json_group_array(name) AS names FROM (
            SELECT name FROM (
            SELECT 'created_at' AS name WHERE OLD."created_at" IS NOT NEW."created_at"
            UNION ALL
            SELECT 'deleted_at' AS name WHERE OLD."deleted_at" IS NOT NEW."deleted_at"
            UNION ALL
            SELECT 'title' AS name WHERE OLD."title" IS NOT NEW."title"
            UNION ALL
            SELECT 'updated_at' AS name WHERE OLD."updated_at" IS NOT NEW."updated_at"
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
CREATE TRIGGER IF NOT EXISTS `tags_sync_outbox_delete` AFTER DELETE ON `tags`
WHEN OLD.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    VALUES ('Tag', OLD.sync_zone, OLD.sync_id, 'DELETE', '[]')
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
CREATE TRIGGER IF NOT EXISTS `transactions_sync_outbox_insert` AFTER INSERT ON `transactions`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    VALUES ('Transaction', NEW.sync_zone, NEW.sync_id, 'SAVE', '["comment","consolidation_parent_transaction_id","consolidation_type","created_at","deleted_at","exchange_rate","external_id","external_source","from_account_id","import_fingerprint","operated_at","title","to_account_id","type","updated_at","updated_by"]')
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
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `transactions_sync_outbox_delete` AFTER DELETE ON `transactions`
WHEN OLD.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    VALUES ('Transaction', OLD.sync_zone, OLD.sync_id, 'DELETE', '[]')
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
CREATE TRIGGER IF NOT EXISTS `transaction_entries_sync_outbox_insert` AFTER INSERT ON `transaction_entries`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Transaction', parent.sync_zone, parent.sync_id, 'SAVE', '["transaction_entries"]'
    FROM `transactions` AS parent
    WHERE parent.id = NEW."transaction_id" AND parent.sync_id IS NOT NULL
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
CREATE TRIGGER IF NOT EXISTS `transaction_entries_sync_outbox_update` AFTER UPDATE ON `transaction_entries`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Transaction', parent.sync_zone, parent.sync_id, 'SAVE', '["transaction_entries"]'
    FROM `transactions` AS parent
    WHERE parent.id = NEW."transaction_id" AND parent.sync_id IS NOT NULL
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
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Transaction', parent.sync_zone, parent.sync_id, 'SAVE', '["transaction_entries"]'
    FROM `transactions` AS parent
    WHERE parent.id = OLD."transaction_id" AND parent.sync_id IS NOT NULL AND OLD."transaction_id" IS NOT NEW."transaction_id"
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
CREATE TRIGGER IF NOT EXISTS `transaction_entries_sync_outbox_delete` AFTER DELETE ON `transaction_entries`
WHEN OLD.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Transaction', parent.sync_zone, parent.sync_id, 'SAVE', '["transaction_entries"]'
    FROM `transactions` AS parent
    WHERE parent.id = OLD."transaction_id" AND parent.sync_id IS NOT NULL
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
CREATE TRIGGER IF NOT EXISTS `transaction_tags_sync_outbox_insert` AFTER INSERT ON `transaction_tags`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Transaction', parent.sync_zone, parent.sync_id, 'SAVE', '["transaction_tags"]'
    FROM `transactions` AS parent
    WHERE parent.id = NEW."transaction_id" AND parent.sync_id IS NOT NULL
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
CREATE TRIGGER IF NOT EXISTS `transaction_tags_sync_outbox_update` AFTER UPDATE ON `transaction_tags`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Transaction', parent.sync_zone, parent.sync_id, 'SAVE', '["transaction_tags"]'
    FROM `transactions` AS parent
    WHERE parent.id = NEW."transaction_id" AND parent.sync_id IS NOT NULL
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
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Transaction', parent.sync_zone, parent.sync_id, 'SAVE', '["transaction_tags"]'
    FROM `transactions` AS parent
    WHERE parent.id = OLD."transaction_id" AND parent.sync_id IS NOT NULL AND OLD."transaction_id" IS NOT NEW."transaction_id"
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
CREATE TRIGGER IF NOT EXISTS `transaction_tags_sync_outbox_delete` AFTER DELETE ON `transaction_tags`
WHEN OLD.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Transaction', parent.sync_zone, parent.sync_id, 'SAVE', '["transaction_tags"]'
    FROM `transactions` AS parent
    WHERE parent.id = OLD."transaction_id" AND parent.sync_id IS NOT NULL
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
CREATE TRIGGER IF NOT EXISTS `transaction_receipts_sync_outbox_insert` AFTER INSERT ON `transaction_receipts`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Transaction', parent.sync_zone, parent.sync_id, 'SAVE', '["transaction_receipts"]'
    FROM `transactions` AS parent
    WHERE parent.id = NEW."transaction_id" AND parent.sync_id IS NOT NULL
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
CREATE TRIGGER IF NOT EXISTS `transaction_receipts_sync_outbox_update` AFTER UPDATE ON `transaction_receipts`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Transaction', parent.sync_zone, parent.sync_id, 'SAVE', '["transaction_receipts"]'
    FROM `transactions` AS parent
    WHERE parent.id = NEW."transaction_id" AND parent.sync_id IS NOT NULL
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
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Transaction', parent.sync_zone, parent.sync_id, 'SAVE', '["transaction_receipts"]'
    FROM `transactions` AS parent
    WHERE parent.id = OLD."transaction_id" AND parent.sync_id IS NOT NULL AND OLD."transaction_id" IS NOT NEW."transaction_id"
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
CREATE TRIGGER IF NOT EXISTS `transaction_receipts_sync_outbox_delete` AFTER DELETE ON `transaction_receipts`
WHEN OLD.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Transaction', parent.sync_zone, parent.sync_id, 'SAVE', '["transaction_receipts"]'
    FROM `transactions` AS parent
    WHERE parent.id = OLD."transaction_id" AND parent.sync_id IS NOT NULL
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
CREATE TRIGGER IF NOT EXISTS `account_external_ids_sync_outbox_insert` AFTER INSERT ON `account_external_ids`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Account', parent.sync_zone, parent.sync_id, 'SAVE', '["account_external_ids"]'
    FROM `accounts` AS parent
    WHERE parent.id = NEW."account_id" AND parent.sync_id IS NOT NULL
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
CREATE TRIGGER IF NOT EXISTS `account_external_ids_sync_outbox_update` AFTER UPDATE ON `account_external_ids`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Account', parent.sync_zone, parent.sync_id, 'SAVE', '["account_external_ids"]'
    FROM `accounts` AS parent
    WHERE parent.id = NEW."account_id" AND parent.sync_id IS NOT NULL
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
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Account', parent.sync_zone, parent.sync_id, 'SAVE', '["account_external_ids"]'
    FROM `accounts` AS parent
    WHERE parent.id = OLD."account_id" AND parent.sync_id IS NOT NULL AND OLD."account_id" IS NOT NEW."account_id"
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
CREATE TRIGGER IF NOT EXISTS `account_external_ids_sync_outbox_delete` AFTER DELETE ON `account_external_ids`
WHEN OLD.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Account', parent.sync_zone, parent.sync_id, 'SAVE', '["account_external_ids"]'
    FROM `accounts` AS parent
    WHERE parent.id = OLD."account_id" AND parent.sync_id IS NOT NULL
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
CREATE TRIGGER IF NOT EXISTS `budget_category_limits_sync_outbox_insert` AFTER INSERT ON `budget_category_limits`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Budget', parent.sync_zone, parent.sync_id, 'SAVE', '["budget_category_limits"]'
    FROM `budgets` AS parent
    WHERE parent.id = NEW."budget_id" AND parent.sync_id IS NOT NULL
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
CREATE TRIGGER IF NOT EXISTS `budget_category_limits_sync_outbox_update` AFTER UPDATE ON `budget_category_limits`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Budget', parent.sync_zone, parent.sync_id, 'SAVE', '["budget_category_limits"]'
    FROM `budgets` AS parent
    WHERE parent.id = NEW."budget_id" AND parent.sync_id IS NOT NULL
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
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Budget', parent.sync_zone, parent.sync_id, 'SAVE', '["budget_category_limits"]'
    FROM `budgets` AS parent
    WHERE parent.id = OLD."budget_id" AND parent.sync_id IS NOT NULL AND OLD."budget_id" IS NOT NEW."budget_id"
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
CREATE TRIGGER IF NOT EXISTS `budget_category_limits_sync_outbox_delete` AFTER DELETE ON `budget_category_limits`
WHEN OLD.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Budget', parent.sync_zone, parent.sync_id, 'SAVE', '["budget_category_limits"]'
    FROM `budgets` AS parent
    WHERE parent.id = OLD."budget_id" AND parent.sync_id IS NOT NULL
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
CREATE TRIGGER IF NOT EXISTS `budget_sinking_funds_sync_outbox_insert` AFTER INSERT ON `budget_sinking_funds`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Budget', parent.sync_zone, parent.sync_id, 'SAVE', '["budget_sinking_funds"]'
    FROM `budgets` AS parent
    WHERE parent.id = NEW."budget_id" AND parent.sync_id IS NOT NULL
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
CREATE TRIGGER IF NOT EXISTS `budget_sinking_funds_sync_outbox_update` AFTER UPDATE ON `budget_sinking_funds`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Budget', parent.sync_zone, parent.sync_id, 'SAVE', '["budget_sinking_funds"]'
    FROM `budgets` AS parent
    WHERE parent.id = NEW."budget_id" AND parent.sync_id IS NOT NULL
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
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Budget', parent.sync_zone, parent.sync_id, 'SAVE', '["budget_sinking_funds"]'
    FROM `budgets` AS parent
    WHERE parent.id = OLD."budget_id" AND parent.sync_id IS NOT NULL AND OLD."budget_id" IS NOT NEW."budget_id"
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
CREATE TRIGGER IF NOT EXISTS `budget_sinking_funds_sync_outbox_delete` AFTER DELETE ON `budget_sinking_funds`
WHEN OLD.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Budget', parent.sync_zone, parent.sync_id, 'SAVE', '["budget_sinking_funds"]'
    FROM `budgets` AS parent
    WHERE parent.id = OLD."budget_id" AND parent.sync_id IS NOT NULL
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
CREATE TRIGGER IF NOT EXISTS `budget_limit_changes_sync_outbox_insert` AFTER INSERT ON `budget_limit_changes`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Budget', parent.sync_zone, parent.sync_id, 'SAVE', '["budget_limit_changes"]'
    FROM `budgets` AS parent
    WHERE parent.id = NEW."budget_id" AND parent.sync_id IS NOT NULL
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
CREATE TRIGGER IF NOT EXISTS `budget_limit_changes_sync_outbox_update` AFTER UPDATE ON `budget_limit_changes`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Budget', parent.sync_zone, parent.sync_id, 'SAVE', '["budget_limit_changes"]'
    FROM `budgets` AS parent
    WHERE parent.id = NEW."budget_id" AND parent.sync_id IS NOT NULL
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
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Budget', parent.sync_zone, parent.sync_id, 'SAVE', '["budget_limit_changes"]'
    FROM `budgets` AS parent
    WHERE parent.id = OLD."budget_id" AND parent.sync_id IS NOT NULL AND OLD."budget_id" IS NOT NEW."budget_id"
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
CREATE TRIGGER IF NOT EXISTS `budget_limit_changes_sync_outbox_delete` AFTER DELETE ON `budget_limit_changes`
WHEN OLD.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Budget', parent.sync_zone, parent.sync_id, 'SAVE', '["budget_limit_changes"]'
    FROM `budgets` AS parent
    WHERE parent.id = OLD."budget_id" AND parent.sync_id IS NOT NULL
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
CREATE TRIGGER IF NOT EXISTS `rule_conditions_sync_outbox_insert` AFTER INSERT ON `rule_conditions`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Rule', parent.sync_zone, parent.sync_id, 'SAVE', '["rule_conditions"]'
    FROM `rules` AS parent
    WHERE parent.id = NEW."rule_id" AND parent.sync_id IS NOT NULL
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
CREATE TRIGGER IF NOT EXISTS `rule_conditions_sync_outbox_update` AFTER UPDATE ON `rule_conditions`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Rule', parent.sync_zone, parent.sync_id, 'SAVE', '["rule_conditions"]'
    FROM `rules` AS parent
    WHERE parent.id = NEW."rule_id" AND parent.sync_id IS NOT NULL
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
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Rule', parent.sync_zone, parent.sync_id, 'SAVE', '["rule_conditions"]'
    FROM `rules` AS parent
    WHERE parent.id = OLD."rule_id" AND parent.sync_id IS NOT NULL AND OLD."rule_id" IS NOT NEW."rule_id"
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
CREATE TRIGGER IF NOT EXISTS `rule_conditions_sync_outbox_delete` AFTER DELETE ON `rule_conditions`
WHEN OLD.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Rule', parent.sync_zone, parent.sync_id, 'SAVE', '["rule_conditions"]'
    FROM `rules` AS parent
    WHERE parent.id = OLD."rule_id" AND parent.sync_id IS NOT NULL
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
CREATE TRIGGER IF NOT EXISTS `rule_actions_sync_outbox_insert` AFTER INSERT ON `rule_actions`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Rule', parent.sync_zone, parent.sync_id, 'SAVE', '["rule_actions"]'
    FROM `rules` AS parent
    WHERE parent.id = NEW."rule_id" AND parent.sync_id IS NOT NULL
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
CREATE TRIGGER IF NOT EXISTS `rule_actions_sync_outbox_update` AFTER UPDATE ON `rule_actions`
WHEN NEW.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Rule', parent.sync_zone, parent.sync_id, 'SAVE', '["rule_actions"]'
    FROM `rules` AS parent
    WHERE parent.id = NEW."rule_id" AND parent.sync_id IS NOT NULL
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
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Rule', parent.sync_zone, parent.sync_id, 'SAVE', '["rule_actions"]'
    FROM `rules` AS parent
    WHERE parent.id = OLD."rule_id" AND parent.sync_id IS NOT NULL AND OLD."rule_id" IS NOT NEW."rule_id"
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
CREATE TRIGGER IF NOT EXISTS `rule_actions_sync_outbox_delete` AFTER DELETE ON `rule_actions`
WHEN OLD.sync_id IS NOT NULL AND COALESCE((SELECT is_applying FROM sync_apply_state WHERE id = 1), 0) = 0
BEGIN
    INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
    SELECT 'Rule', parent.sync_zone, parent.sync_id, 'SAVE', '["rule_actions"]'
    FROM `rules` AS parent
    WHERE parent.id = OLD."rule_id" AND parent.sync_id IS NOT NULL
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
