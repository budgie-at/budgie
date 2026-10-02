-- Turns on the PIN, biometric, and screenshot protection lock flags.

UPDATE settings
SET
    is_pin_enabled = 1,
    is_biometric_enabled = 1,
    is_screenshot_protection_enabled = 1,
    updated_at = unixepoch('now');
