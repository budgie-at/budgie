import { updateAiFeatureMutation } from '@app/settings/mutation/update-settings.mutation';
import { Db, SettingsRepository } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { testDb } from '../../harness/scenario/setup';

describe('AI feature mutation', () => {
    it.effect('serializes selected flags with a fresh aggregate and preserves unrelated settings', () =>
        Effect.gen(function* () {
            const repository = yield* SettingsRepository;
            yield* repository.update({
                isAiEnabled: false,
                isAiVoiceInputEnabled: false,
                isAiSuggestionsEnabled: false,
                isAiTranslationsEnabled: false,
                showCents: false
            });
            yield* Effect.all(
                [updateAiFeatureMutation('isAiVoiceInputEnabled', true), updateAiFeatureMutation('isAiSuggestionsEnabled', true)],
                { concurrency: 'unbounded' }
            );
            expect(yield* repository.getSettings()).toMatchObject({
                isAiEnabled: true,
                isAiVoiceInputEnabled: true,
                isAiSuggestionsEnabled: true,
                isAiTranslationsEnabled: false,
                showCents: false
            });
            yield* repository.update({ isAiSuggestionsEnabled: false });
            yield* Effect.all(
                [updateAiFeatureMutation('isAiVoiceInputEnabled', false), updateAiFeatureMutation('isAiTranslationsEnabled', true)],
                { concurrency: 'unbounded' }
            );
            expect(yield* repository.getSettings()).toMatchObject({
                isAiEnabled: true,
                isAiVoiceInputEnabled: false,
                isAiSuggestionsEnabled: false,
                isAiTranslationsEnabled: true
            });
            yield* updateAiFeatureMutation('isAiTranslationsEnabled', false);
            yield* updateAiFeatureMutation('isAiTranslationsEnabled', true);
            yield* updateAiFeatureMutation('isAiTranslationsEnabled', false);
            expect((yield* repository.getSettings()).isAiEnabled).toBe(false);
        }).pipe(Effect.provide(SettingsRepository.layer), Effect.provideService(Db, testDb))
    );
});
