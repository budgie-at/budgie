-- Scene overlay: the app is locked.
--
-- Turns on the three security flags the seed hook otherwise forces to 0, so a
-- cold launch lands on the PIN keypad and Settings -> Security shows the whole
-- group enabled.
--
-- CAPTURE CONTRACT. The PIN itself is not a database row: `auth.service.ts`
-- keeps it in the iOS keychain and `db.ts` feeds it to `PRAGMA key`, so the PIN
-- also encrypts the database. The seeded database is plaintext and the keychain
-- is empty, which means `verifyPin` can never match and no deep link can walk
-- past the lock screen. A scene that declares this overlay either
--
--   * captures the lock screen itself (`pin-app-lock-1`), or
--   * runs a flow that creates the PIN through the app first
--     (`budgie://settings/pin?mode=CREATE`), which rekeys the database and
--     stores the PIN, and only then navigates to the screen being captured.
--
-- Contains no user-visible text, so it needs no locale branches.

UPDATE settings
SET
    is_pin_enabled = 1,
    is_biometric_enabled = 1,
    is_screenshot_protection_enabled = 1,
    updated_at = unixepoch('now');
