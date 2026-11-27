import { afterEach, describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as TestClock from 'effect/testing/TestClock';
import { vi } from 'vitest';

import { waitForIdle } from '../src/@generic/utils/wait-for-idle.util';

describe('waitForIdle', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it.effect('resolves immediately when requestIdleCallback invokes its callback', () =>
        Effect.gen(function* () {
            const requestIdleCallbackSpy = vi.fn((callback: IdleRequestCallback) => {
                callback({ didTimeout: false, timeRemaining: () => 50 });

                return 7;
            });
            const cancelIdleCallbackSpy = vi.fn();
            vi.stubGlobal('requestIdleCallback', requestIdleCallbackSpy);
            vi.stubGlobal('cancelIdleCallback', cancelIdleCallbackSpy);

            yield* waitForIdle;

            expect(requestIdleCallbackSpy).toHaveBeenCalledTimes(1);
            expect(cancelIdleCallbackSpy).not.toHaveBeenCalled();
        })
    );

    it.effect('times out after 100ms and cancels the idle callback when requestIdleCallback never fires in background', () =>
        Effect.gen(function* () {
            const requestIdleCallbackSpy = vi.fn(() => 42);
            const cancelIdleCallbackSpy = vi.fn();
            vi.stubGlobal('requestIdleCallback', requestIdleCallbackSpy);
            vi.stubGlobal('cancelIdleCallback', cancelIdleCallbackSpy);

            const fiber = yield* Effect.forkChild(waitForIdle);
            yield* Effect.yieldNow;
            expect(requestIdleCallbackSpy).toHaveBeenCalledTimes(1);
            expect(fiber.pollUnsafe()).toBeUndefined();

            yield* TestClock.adjust(100);
            yield* Fiber.join(fiber);

            expect(cancelIdleCallbackSpy).toHaveBeenCalledWith(42);
        })
    );
});
