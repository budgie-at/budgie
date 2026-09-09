.read social-showcase.sql
UPDATE settings
SET
    is_pin_enabled = 1,
    is_biometric_enabled = 1,
    is_screenshot_protection_enabled = 0,
    updated_at = unixepoch('now');
