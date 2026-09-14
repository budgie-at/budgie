-- Replays the migrations the app would run at launch and stops before the 0053 AI-consent backfill, so the Settings AI group mounts from the build flag with consent at its default off and no model load (see #1037).
.read ../../../../../packages/app/drizzle/0046_repoint_debt_event_entries.sql
.read ../../../../../packages/app/drizzle/0047_repair_double_counted_manual_debt_events.sql
.read ../../../../../packages/app/drizzle/0048_repair_cross_instrument_debt_events.sql
.read ../../../../../packages/app/drizzle/0049_add_bank_sync_backward_limit.sql
.read ../../../../../packages/app/drizzle/0050_add_onboarding_completed.sql
.read ../../../../../packages/app/drizzle/0051_add_onboarding_step_and_ai_consent.sql
.read ../../../../../packages/app/drizzle/0052_soft_cerebro.sql

INSERT INTO __drizzle_migrations (hash, created_at) VALUES ('', 1787300000000);

UPDATE settings
SET is_ai_enabled = 0,
    is_onboarding_completed = 1,
    updated_at = unixepoch('now');
