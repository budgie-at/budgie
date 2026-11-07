import { describe, expect, it } from '@effect/vitest';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Atom from 'effect/reactivity/Atom';
import { vi } from 'vitest';

import { appAtomRegistry } from '../src/@generic/constant/app-atom-registry.constant';
import { AiSubsystemNameEnum } from '../src/ai/enum/ai-subsystem-name.enum';
import { DrainerStateEnum } from '../src/ai/enum/drainer-state.enum';
import { DrainerService } from '../src/ai/service/drainer.service';

import { inertDbLayer } from './fixture/inert-db-layer';

import type { DrainerSnapshotInterface } from '../src/ai/interface/drainer-snapshot.interface';
import type { AiModelResidencyService } from '../src/ai/service/ai-model-residency.service';

vi.mock('react-native', () => ({ AppState: { currentState: 'active' } }));

class ResidencyTestService extends Context.Service<ResidencyTestService, Context.Service.Shape<typeof AiModelResidencyService>>()(
    'test/ResidencyTestService'
) {}

const residencyLayer = Layer.mock(ResidencyTestService)({ acquire: () => Effect.succeed(true), release: () => Effect.void });

const testLayer = Layer.mergeAll(residencyLayer, inertDbLayer);

const makeDrainer = Effect.fnUntraced(function* (fetchPending: (limit: number) => Effect.Effect<Effect.Effect<void, string>[], string>) {
    const residency = yield* ResidencyTestService;
    const snapshot = Atom.keepAlive(Atom.make<DrainerSnapshotInterface>({ state: DrainerStateEnum.IDLE, pending: 0, errorMessage: null }));
    const drainer = DrainerService.make<string>(
        {
            subsystem: AiSubsystemNameEnum.EMBEDDING,
            relaxedIntervalMs: 1000,
            relaxedBatchSize: 5,
            boostBatchSize: 5,
            yieldEveryRows: 100,
            snapshot,
            fetchPending,
            countPending: Effect.succeed(0),
            afterBatch: Effect.void
        },
        residency
    );

    return { snapshot, service: yield* drainer };
});

const readState = (snapshot: Atom.Writable<DrainerSnapshotInterface>) => appAtomRegistry.get(snapshot).state;

describe('DrainerService state transitions', () => {
    it.effect('keeps a user pause when the drainer is stopped', () =>
        Effect.gen(function* () {
            const { snapshot, service } = yield* makeDrainer(() => Effect.succeed([]));
            yield* service.pause();
            yield* service.stop();

            expect(readState(snapshot)).toBe(DrainerStateEnum.PAUSED);
        }).pipe(Effect.scoped, Effect.provide(testLayer))
    );

    it.live('gives a boost started from ERROR a fresh failure budget', () =>
        Effect.gen(function* () {
            const failure = Effect.fail('boom');
            let call = 0;
            const { snapshot, service } = yield* makeDrainer(() => {
                call += 1;
                if (call === 1) {
                    return Effect.succeed(Array.from({ length: 5 }, () => failure));
                }
                if (call === 2) {
                    return Effect.succeed([failure]);
                }

                return Effect.succeed([]);
            });
            yield* service.start();
            yield* service.boost();
            expect(readState(snapshot)).toBe(DrainerStateEnum.ERROR);

            yield* service.boost();
            expect(readState(snapshot)).toBe(DrainerStateEnum.IDLE);
        }).pipe(Effect.scoped, Effect.provide(testLayer))
    );
});
