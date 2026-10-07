import { ExternalSourceEnum, SyncEntityTable, SyncRepository } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { getTableName } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Queue from 'effect/Queue';
import * as Reactivity from 'effect/reactivity/Reactivity';
import * as Ref from 'effect/Ref';
import * as Stream from 'effect/Stream';
import { AppState } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { BackgroundSyncModule } from '../../../modules/background-sync';
import { Workload } from '../../@generic/service/workload.service';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';

import type { BackgroundSyncSessionInterface } from '../interface/background-sync-session.interface';
import type { SyncEntityInterface } from '@budgie/contracts';

export class BackgroundSyncSessionService extends Context.Service<BackgroundSyncSessionService>()(
    '@budgie/app/BackgroundSyncSessionService',
    {
        make: Effect.gen(function* () {
            const reactivity = yield* Reactivity.Reactivity;
            const syncRepository = yield* SyncRepository;
            const workload = yield* Workload;
            const session = yield* Ref.make<BackgroundSyncSessionInterface | null>(null);
            const nativeModule = BackgroundSyncModule;

            if (!isDefined(nativeModule)) {
                return { start: () => Effect.void, isContinued: Effect.succeed(false) };
            }

            const pendingBackwardSyncs = Effect.map(
                Effect.forEach(Object.values(ExternalSourceEnum), provider => syncRepository.getPendingBackwardSync(provider)),
                syncs => syncs.flat()
            );

            const toPositions = (syncs: SyncEntityInterface[]): ReadonlyMap<number, number | null> =>
                new Map(syncs.map(sync => [sync.id, sync.backwardSyncFromAt?.getTime() ?? null]));

            const expirations = Stream.callback<null>(queue =>
                Effect.acquireRelease(
                    Effect.sync(() =>
                        nativeModule.addListener('onExpire', () => {
                            Queue.offerUnsafe(queue, null);
                        })
                    ),
                    subscription =>
                        Effect.sync(() => {
                            subscription.remove();
                        })
                )
            );

            const end = Effect.fnUntraced(function* () {
                if (isDefined(yield* Ref.getAndSet(session, null))) {
                    yield* Effect.promise(() => nativeModule.end(true));
                }
            });

            const expire = Effect.fnUntraced(function* () {
                yield* Ref.set(session, null);
                if (AppState.currentState !== 'active') {
                    yield* workload.interruptBackground;
                }
            });

            const reportProgress = (completedCount: number, remainingCount: number) =>
                Effect.promise(() => nativeModule.setProgress(completedCount, completedCount + remainingCount));

            const begin = Effect.fnUntraced(function* (syncs: SyncEntityInterface[]) {
                if (AppState.currentState !== 'active') {
                    return;
                }

                const isContinued = yield* Effect.promise(() =>
                    nativeModule.begin(t`Syncing bank history`, t`Your transactions keep importing in the background`)
                );
                yield* Ref.set(session, { isContinued, completedCount: 0, positions: toPositions(syncs) });
                yield* reportProgress(0, syncs.length);
            });

            const advance = Effect.fnUntraced(function* (current: BackgroundSyncSessionInterface, syncs: SyncEntityInterface[]) {
                const positions = toPositions(syncs);
                const completedCount =
                    current.completedCount +
                    [...current.positions].filter(([syncId, position]) => positions.get(syncId) !== position).length;

                yield* Ref.set(session, { ...current, completedCount, positions });
                yield* reportProgress(completedCount, syncs.length);
            });

            const handleSnapshot = Effect.fnUntraced(function* (syncs: SyncEntityInterface[] | null) {
                if (!isDefined(syncs)) {
                    return yield* expire();
                }

                if (!isNotEmptyArray(syncs)) {
                    return yield* end();
                }

                const current = yield* Ref.get(session);

                return isDefined(current) ? yield* advance(current, syncs) : yield* begin(syncs);
            });

            return {
                start: Effect.fn('BackgroundSyncSessionService.start')(function* () {
                    yield* Effect.forkDetach(
                        logAndContinue(
                            Stream.runForEach(
                                Stream.merge(reactivity.stream([getTableName(SyncEntityTable)], pendingBackwardSyncs), expirations),
                                handleSnapshot
                            ).pipe(Effect.ensuring(end()))
                        )
                    );
                }),
                isContinued: Effect.map(Ref.get(session), current => current?.isContinued === true)
            };
        })
    }
) {
    static readonly layer = Layer.effect(BackgroundSyncSessionService, BackgroundSyncSessionService.make).pipe(
        Layer.provide([SyncRepository.layer, Workload.layer])
    );
}
