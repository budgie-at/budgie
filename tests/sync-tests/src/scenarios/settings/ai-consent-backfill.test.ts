import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { applyMigration, testDb, TestLayer } from '../../harness';

const MIGRATION = '0053_backfill_ai_consent_for_existing_installs.sql';

const readAiConsent = Effect.promise(() =>
    testDb.$client.getFirstAsync<{ is_ai_enabled: number }>(`SELECT is_ai_enabled FROM settings LIMIT 1`)
).pipe(Effect.map(row => row?.is_ai_enabled));

const markConsentPending = Effect.promise(() =>
    testDb.$client.runAsync(`UPDATE settings SET is_ai_enabled = 0, is_onboarding_completed = 0, onboarding_step = 0`)
);

describe('settings/ai-consent-backfill', () => {
    it.effect('leaves a fresh install on the consent flow after the full migration chain', () =>
        Effect.gen(function* () {
            expect(yield* readAiConsent).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('enables AI for installs that already finished onboarding', () =>
        Effect.gen(function* () {
            yield* markConsentPending;
            yield* Effect.promise(() => testDb.$client.runAsync(`UPDATE settings SET is_onboarding_completed = 1`));

            yield* applyMigration(MIGRATION);

            expect(yield* readAiConsent).toBe(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('enables AI for installs that are resuming onboarding', () =>
        Effect.gen(function* () {
            yield* markConsentPending;
            yield* Effect.promise(() => testDb.$client.runAsync(`UPDATE settings SET onboarding_step = 3`));

            yield* applyMigration(MIGRATION);

            expect(yield* readAiConsent).toBe(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('enables AI for installs that already own accounts', () =>
        Effect.gen(function* () {
            yield* markConsentPending;
            yield* Effect.promise(() =>
                testDb.$client.runAsync(
                    `INSERT INTO accounts (title, title_search, type, nature, icon, instrument_id, "order", is_active, include_in_net_worth, target_balance)
             VALUES ('Existing Cash', 'existing cash', 'CASH', 'ASSET', 'Wallet', 1, 910, 1, 1, 0)`
                )
            );

            yield* applyMigration(MIGRATION);

            expect(yield* readAiConsent).toBe(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps a fresh install disabled when nothing predates the consent gate', () =>
        Effect.gen(function* () {
            yield* markConsentPending;

            yield* applyMigration(MIGRATION);

            expect(yield* readAiConsent).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );
});
