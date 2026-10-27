.read screenshot-protection.sql

UPDATE settings
SET last_backup_at = unixepoch('now');
