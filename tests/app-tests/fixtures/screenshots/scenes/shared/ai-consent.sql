-- Replays the migrations the app would run at launch, then grants the AI consent only onboarding writes, so AI scenes mount a live subsystem instead of the consent-gated off state.
.read ../../../../../packages/app/drizzle/0046_repoint_debt_event_entries.sql
.read ../../../../../packages/app/drizzle/0047_repair_double_counted_manual_debt_events.sql
.read ../../../../../packages/app/drizzle/0048_repair_cross_instrument_debt_events.sql
.read ../../../../../packages/app/drizzle/0049_add_bank_sync_backward_limit.sql
.read ../../../../../packages/app/drizzle/0050_add_onboarding_completed.sql
.read ../../../../../packages/app/drizzle/0051_add_onboarding_step_and_ai_consent.sql
.read ../../../../../packages/app/drizzle/0052_soft_cerebro.sql

INSERT INTO __drizzle_migrations (hash, created_at) VALUES ('', 1787200000000);

UPDATE settings
SET is_ai_enabled = 1,
    is_onboarding_completed = 1,
    updated_at = unixepoch('now');
