ALTER TABLE `sync_apply_state` ADD `last_local_change_at` integer;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `last_local_change_sync_outbox_insert` AFTER INSERT ON `sync_outbox`
BEGIN
    INSERT INTO sync_apply_state (id, last_local_change_at)
    VALUES (1, CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER))
    ON CONFLICT (id) DO UPDATE SET last_local_change_at = excluded.last_local_change_at;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `last_local_change_sync_outbox_update` AFTER UPDATE ON `sync_outbox`
BEGIN
    INSERT INTO sync_apply_state (id, last_local_change_at)
    VALUES (1, CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER))
    ON CONFLICT (id) DO UPDATE SET last_local_change_at = excluded.last_local_change_at;
END;
