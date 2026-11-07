export const MOVED_TO_TOMBSTONE_SQL =
    "sync_zone = ? AND record_type = ? AND json_extract(payload, '$.encryptedFields.movedTo') IS NOT NULL";
