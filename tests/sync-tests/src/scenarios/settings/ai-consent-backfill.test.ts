import { describe, expect, it } from 'vitest';

import { applyMigration, testDb } from '../../harness';

const MIGRATION = '0053_backfill_ai_consent_for_existing_installs.sql';

const readAiConsent = async (): Promise<number | undefined> => {
    const row = await testDb.$client.getFirstAsync<{ is_ai_enabled: number }>(`SELECT is_ai_enabled FROM settings LIMIT 1`);

    return row?.is_ai_enabled;
};

const markConsentPending = async (): Promise<void> => {
    await testDb.$client.runAsync(`UPDATE settings SET is_ai_enabled = 0, is_onboarding_completed = 0, onboarding_step = 0`);
};

describe('settings/ai-consent-backfill', () => {
    it('leaves a fresh install on the consent flow after the full migration chain', async () => {
        expect(await readAiConsent()).toBe(0);
    });

    it('enables AI for installs that already finished onboarding', async () => {
        await markConsentPending();
        await testDb.$client.runAsync(`UPDATE settings SET is_onboarding_completed = 1`);

        await applyMigration(MIGRATION);

        expect(await readAiConsent()).toBe(1);
    });

    it('enables AI for installs that are resuming onboarding', async () => {
        await markConsentPending();
        await testDb.$client.runAsync(`UPDATE settings SET onboarding_step = 3`);

        await applyMigration(MIGRATION);

        expect(await readAiConsent()).toBe(1);
    });

    it('enables AI for installs that already own accounts', async () => {
        await markConsentPending();
        await testDb.$client.runAsync(
            `INSERT INTO accounts (title, title_search, type, nature, icon, instrument_id, "order", is_active, include_in_net_worth, target_balance)
             VALUES ('Existing Cash', 'existing cash', 'CASH', 'ASSET', 'Wallet', 1, 910, 1, 1, 0)`
        );

        await applyMigration(MIGRATION);

        expect(await readAiConsent()).toBe(1);
    });

    it('keeps a fresh install disabled when nothing predates the consent gate', async () => {
        await markConsentPending();

        await applyMigration(MIGRATION);

        expect(await readAiConsent()).toBe(0);
    });
});
