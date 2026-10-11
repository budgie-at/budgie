import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from '@effect/vitest';
import { sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { applyMigration, testDb, TestLayer } from '../../harness';

const MIGRATIONS_FOLDER = resolve(process.cwd(), '../../packages/app/drizzle');
const AI_FEATURE_SETTINGS_COLUMNS = ['is_ai_voice_input_enabled', 'is_ai_suggestions_enabled', 'is_ai_translations_enabled'];
const AI_FEATURE_SETTINGS_SCHEMA_PATTERN = /ALTER\s+TABLE\s+`settings`\s+ADD/iu;
const AI_FEATURE_SETTINGS_BACKFILL_PATTERN = /UPDATE\s+`settings`/iu;
const LEGACY_SETTINGS_TABLE_SQL = `
CREATE TABLE settings (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    created_at integer DEFAULT (unixepoch()) NOT NULL,
    updated_at integer DEFAULT (unixepoch()) NOT NULL,
    deleted_at integer,
    language text DEFAULT 'en' NOT NULL,
    default_account_id integer,
    default_instrument_id integer,
    theme text DEFAULT 'SYSTEM' NOT NULL,
    is_pin_enabled integer DEFAULT false NOT NULL,
    is_biometric_enabled integer DEFAULT false NOT NULL,
    show_cents integer DEFAULT true NOT NULL,
    is_vibration_enabled integer DEFAULT true NOT NULL,
    is_screenshot_protection_enabled integer DEFAULT false NOT NULL,
    apply_mcc_default_category integer DEFAULT true NOT NULL,
    is_budget_widget_enabled integer NOT NULL DEFAULT true,
    is_budget_push_enabled integer NOT NULL DEFAULT false,
    is_onboarding_completed integer DEFAULT false NOT NULL,
    onboarding_step integer DEFAULT 0 NOT NULL,
    is_ai_enabled integer DEFAULT false NOT NULL,
    is_runway_pill_enabled integer DEFAULT true NOT NULL,
    is_runway_crypto_included integer DEFAULT false NOT NULL
)`;

const migrationNames = readdirSync(MIGRATIONS_FOLDER, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

const readMigrationSql = (migrationName: string): string =>
    readFileSync(resolve(MIGRATIONS_FOLDER, migrationName, 'migration.sql'), 'utf8');

const isAiFeatureSettingsMigration = (migrationSql: string): boolean =>
    AI_FEATURE_SETTINGS_COLUMNS.every(columnName => migrationSql.includes(columnName));

const aiFeatureSettingsSchemaMigrationName = migrationNames.find(migrationName => {
    const migrationSql = readMigrationSql(migrationName);

    return isAiFeatureSettingsMigration(migrationSql) && AI_FEATURE_SETTINGS_SCHEMA_PATTERN.test(migrationSql);
});

const aiFeatureSettingsBackfillMigrationName = migrationNames.find(migrationName => {
    const migrationSql = readMigrationSql(migrationName);

    return isAiFeatureSettingsMigration(migrationSql) && AI_FEATURE_SETTINGS_BACKFILL_PATTERN.test(migrationSql);
});

const resetLegacySettingsTable = Effect.fnUntraced(function* (isAiEnabled: boolean) {
    yield* testDb.$client.unsafe('DROP TABLE settings').raw;
    yield* testDb.$client.unsafe(LEGACY_SETTINGS_TABLE_SQL).raw;
    yield* testDb.$client.unsafe(
        `INSERT INTO settings (
                language,
                theme,
                is_ai_enabled
            ) VALUES ('en', 'SYSTEM', ?)`,
        [isAiEnabled ? 1 : 0]
    ).raw;
});

const applyAiFeatureSettingsMigrations = Effect.fnUntraced(function* () {
    expect(aiFeatureSettingsSchemaMigrationName).toBeDefined();
    expect(aiFeatureSettingsBackfillMigrationName).toBeDefined();

    if (isDefined(aiFeatureSettingsSchemaMigrationName)) {
        yield* applyMigration(aiFeatureSettingsSchemaMigrationName);
    }
    if (
        isDefined(aiFeatureSettingsBackfillMigrationName) &&
        aiFeatureSettingsBackfillMigrationName !== aiFeatureSettingsSchemaMigrationName
    ) {
        yield* applyMigration(aiFeatureSettingsBackfillMigrationName);
    }
});

const readAiFeatureSettings = () =>
    testDb.all(
        sql.raw(`
            SELECT
                is_ai_voice_input_enabled AS isAiVoiceInputEnabled,
                is_ai_suggestions_enabled AS isAiSuggestionsEnabled,
                is_ai_translations_enabled AS isAiTranslationsEnabled
            FROM settings
            LIMIT 1
        `)
    );

describe('settings/ai-feature-settings-migration', () => {
    it.effect('includes a migration for AI feature settings', () =>
        Effect.sync(() => {
            expect(aiFeatureSettingsSchemaMigrationName).toBeDefined();
            expect(aiFeatureSettingsBackfillMigrationName).toBeDefined();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('backfills every AI feature when legacy AI consent was enabled', () =>
        Effect.gen(function* () {
            yield* resetLegacySettingsTable(true);
            yield* applyAiFeatureSettingsMigrations();

            expect(yield* readAiFeatureSettings()).toEqual([
                { isAiSuggestionsEnabled: 1, isAiTranslationsEnabled: 1, isAiVoiceInputEnabled: 1 }
            ]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps every AI feature disabled when legacy AI consent was disabled', () =>
        Effect.gen(function* () {
            yield* resetLegacySettingsTable(false);
            yield* applyAiFeatureSettingsMigrations();

            expect(yield* readAiFeatureSettings()).toEqual([
                { isAiSuggestionsEnabled: 0, isAiTranslationsEnabled: 0, isAiVoiceInputEnabled: 0 }
            ]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('starts fresh installs with every AI feature disabled', () =>
        Effect.gen(function* () {
            expect(yield* readAiFeatureSettings()).toEqual([
                { isAiSuggestionsEnabled: 0, isAiTranslationsEnabled: 0, isAiVoiceInputEnabled: 0 }
            ]);
        }).pipe(Effect.provide(TestLayer))
    );
});
