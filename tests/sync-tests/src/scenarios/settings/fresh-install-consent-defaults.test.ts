import { isAiEnabled } from '@app/@generic/utils/is-ai-enabled.util';
import { isAiRuntimeActive } from '@app/ai/utils/is-ai-runtime-active.util';
import { SettingsEntityTable } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { testDb, TestLayer } from '../../harness';

describe('settings/fresh-install-consent-defaults', () => {
    it.effect('leaves a fresh install on the consent flow', () =>
        Effect.gen(function* () {
            const [settings] = yield* testDb.select().from(SettingsEntityTable);

            expect(settings).toMatchObject({ isAiEnabled: false, isOnboardingCompleted: false, onboardingStep: 0 });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps runtime AI inactive when the build supports AI but consent is off', () =>
        Effect.sync(() => {
            expect(isAiEnabled()).toBe(true);
            expect(isAiRuntimeActive()).toBe(false);
        }).pipe(Effect.provide(TestLayer))
    );
});
