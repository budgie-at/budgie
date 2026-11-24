import { describe, expect, it } from '@effect/vitest';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';
import * as AtomRegistry from 'effect/reactivity/AtomRegistry';

import { toLiveAtom } from '../src/@generic/hook/use-live-atom-value.hook';

interface SamplePayloadInterface {
    readonly count: number;
    readonly items: readonly string[];
}

describe('toLiveAtom', () => {
    it.effect('deduplicates waiting and structurally equal emissions without mutating the raw atom', () =>
        Effect.sync(() => {
            const registry = AtomRegistry.make();
            const rawAtom = Atom.make<AsyncResult.AsyncResult<SamplePayloadInterface, string>>(AsyncResult.initial(false));
            const liveAtom = toLiveAtom(rawAtom);

            const rawEmissions: AsyncResult.AsyncResult<SamplePayloadInterface, string>[] = [];
            const liveEmissions: AsyncResult.AsyncResult<SamplePayloadInterface, string>[] = [];

            const unsubscribeRaw = registry.subscribe(rawAtom, value => {
                rawEmissions.push(value);
            });
            const unsubscribeLive = registry.subscribe(liveAtom, value => {
                liveEmissions.push(value);
            });

            const initialWaiting = AsyncResult.initial<SamplePayloadInterface, string>(true);

            registry.set(rawAtom, initialWaiting);
            expect(rawEmissions).toHaveLength(1);
            expect(registry.get(rawAtom)).toBe(initialWaiting);
            expect(liveEmissions).toHaveLength(0);

            const firstSuccess = AsyncResult.success<SamplePayloadInterface, string>({ count: 1, items: ['a'] });

            registry.set(rawAtom, firstSuccess);
            expect(rawEmissions).toHaveLength(2);
            expect(liveEmissions).toHaveLength(1);
            expect(liveEmissions[0]).toBe(firstSuccess);

            const waitingSuccess = AsyncResult.success<SamplePayloadInterface, string>({ count: 1, items: ['a'] }, { waiting: true });

            registry.set(rawAtom, waitingSuccess);
            expect(rawEmissions).toHaveLength(3);
            expect(registry.get(rawAtom)).toBe(waitingSuccess);
            expect(liveEmissions).toHaveLength(1);

            const equalSuccess = AsyncResult.success<SamplePayloadInterface, string>({ count: 1, items: ['a'] });

            registry.set(rawAtom, equalSuccess);
            expect(rawEmissions).toHaveLength(4);
            expect(registry.get(rawAtom)).toBe(equalSuccess);
            expect(liveEmissions).toHaveLength(1);

            unsubscribeLive();
            unsubscribeRaw();
            registry.dispose();
        })
    );

    it.effect('emits on changed success values, failures, and failure recovery', () =>
        Effect.sync(() => {
            const registry = AtomRegistry.make();
            const rawAtom = Atom.make<AsyncResult.AsyncResult<SamplePayloadInterface, string>>(
                AsyncResult.success({ count: 1, items: ['a'] })
            );
            const liveAtom = toLiveAtom(rawAtom);
            const liveEmissions: AsyncResult.AsyncResult<SamplePayloadInterface, string>[] = [];

            const unsubscribe = registry.subscribe(liveAtom, value => {
                liveEmissions.push(value);
            });

            const changedSuccess = AsyncResult.success<SamplePayloadInterface, string>({ count: 2, items: ['a', 'b'] });

            registry.set(rawAtom, changedSuccess);
            expect(liveEmissions).toHaveLength(1);
            expect(liveEmissions[0]).toBe(changedSuccess);

            const failureCause = Cause.fail('load failed');
            const firstFailure = AsyncResult.failure<SamplePayloadInterface, string>(failureCause);

            registry.set(rawAtom, firstFailure);
            expect(liveEmissions).toHaveLength(2);
            expect(liveEmissions[1]).toBe(firstFailure);

            registry.set(rawAtom, AsyncResult.failure<SamplePayloadInterface, string>(failureCause, { waiting: true }));
            expect(liveEmissions).toHaveLength(2);

            const recoveredSuccess = AsyncResult.success<SamplePayloadInterface, string>({ count: 2, items: ['a', 'b'] });

            registry.set(rawAtom, recoveredSuccess);
            expect(liveEmissions).toHaveLength(3);
            expect(liveEmissions[2]).toBe(recoveredSuccess);

            unsubscribe();
            registry.dispose();
        })
    );
});
