import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { SettingsEntityTable } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { testDb, TestLayer } from '../../harness';

const FEATURE_COLUMNS = ['is_ai_voice_input_enabled', 'is_ai_suggestions_enabled', 'is_ai_translations_enabled'];
const MIGRATION_STATEMENTS = readFileSync(
    resolve(process.cwd(), '../../packages/app/drizzle/20261011120000_ai_feature_settings/migration.sql'),
    'utf8'
).split('--> statement-breakpoint');

describe('settings/ai-feature-settings-migration', () => {
    it.effect.each([true, false])('copies legacy AI consent %s into every AI feature', isAiEnabled =>
        Effect.gen(function* () {
            yield* Effect.forEach(
                [
                    ...FEATURE_COLUMNS.map(column => `ALTER TABLE settings DROP COLUMN ${column}`),
                    `UPDATE settings SET is_ai_enabled = ${Number(isAiEnabled)}`,
                    ...MIGRATION_STATEMENTS
                ],
                statement => testDb.$client.unsafe(statement).raw,
                { discard: true }
            );
            const [settings] = yield* testDb.select().from(SettingsEntityTable);

            expect(settings).toMatchObject({
                isAiVoiceInputEnabled: isAiEnabled,
                isAiSuggestionsEnabled: isAiEnabled,
                isAiTranslationsEnabled: isAiEnabled
            });
        }).pipe(Effect.provide(TestLayer))
    );
});
