import { ExternalSourceEnum, SyncEntityTable, SyncRepository } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { getTableName } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';
import * as Stream from 'effect/Stream';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { BackgroundSyncModule } from '../../../modules/background-sync';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';

export class BackgroundSyncSessionService extends Context.Service<BackgroundSyncSessionService>()(
    '@budgie/app/BackgroundSyncSessionService',
    {
        make: Effect.gen(function* () {
            const reactivity = yield* Reactivity.Reactivity;
            const syncRepository = yield* SyncRepository;

            const pendingBackwardSyncs = Effect.map(
                Effect.forEach(Object.values(ExternalSourceEnum), provider => syncRepository.getPendingBackwardSync(provider)),
                syncs => syncs.flat()
            );

            return {
                start: Effect.fn('BackgroundSyncSessionService.start')(function* () {
                    const nativeModule = BackgroundSyncModule;
                    if (!isDefined(nativeModule)) {
                        return;
                    }

                    yield* Effect.forkDetach(
                        logAndContinue(
                            Stream.runForEach(
                                Stream.zipWithIndex(reactivity.stream([getTableName(SyncEntityTable)], pendingBackwardSyncs)),
                                ([syncs, completed]) =>
                                    Effect.promise(() =>
                                        isNotEmptyArray(syncs)
                                            ? nativeModule.update(
                                                  t`Syncing bank history`,
                                                  t`Your transactions keep importing in the background`,
                                                  completed,
                                                  completed + syncs.length
                                              )
                                            : nativeModule.stop()
                                    )
                            )
                        )
                    );
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(BackgroundSyncSessionService, BackgroundSyncSessionService.make).pipe(
        Layer.provide(SyncRepository.layer)
    );
}
