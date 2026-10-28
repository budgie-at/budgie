import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as AtomRegistry from 'effect/reactivity/AtomRegistry';
import { vi } from 'vitest';

import { delayedFlagAtom } from '../src/@generic/constant/delayed-flag-atom.constant';

describe('delayedFlagAtom', () => {
    it.effect('turns true only after the delay while active and resets once inactive', () =>
        Effect.sync(() => {
            vi.useFakeTimers();

            const registry = AtomRegistry.make();
            const unmountActive = registry.mount(delayedFlagAtom([true, 400]));

            expect(registry.get(delayedFlagAtom([true, 400]))).toBe(false);

            vi.advanceTimersByTime(399);
            expect(registry.get(delayedFlagAtom([true, 400]))).toBe(false);

            vi.advanceTimersByTime(1);
            expect(registry.get(delayedFlagAtom([true, 400]))).toBe(true);

            unmountActive();
            expect(registry.get(delayedFlagAtom([false, 400]))).toBe(false);

            vi.useRealTimers();
        })
    );
});
