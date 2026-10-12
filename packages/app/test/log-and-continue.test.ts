import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { logAndContinue } from '../src/@generic/utils/log-and-continue.util';

describe('logAndContinue', () => {
    it.effect('passes the success value through', () =>
        Effect.gen(function* () {
            const value = yield* logAndContinue(Effect.succeed(1));

            expect(value).toBe(1);
        })
    );

    it.effect('turns a failure into a successful effect', () =>
        Effect.gen(function* () {
            const exit = yield* Effect.exit(logAndContinue(Effect.fail('boom')));

            expect(exit._tag).toBe('Success');
        })
    );
});
