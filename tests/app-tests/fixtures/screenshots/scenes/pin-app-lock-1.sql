UPDATE settings
SET
    is_pin_enabled = 1,
    is_biometric_enabled = 1,
    updated_at = unixepoch('now');
