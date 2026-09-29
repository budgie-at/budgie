import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as FiberHandle from 'effect/FiberHandle';
import * as FiberSet from 'effect/FiberSet';
import * as Atom from 'effect/reactivity/Atom';
import * as Scope from 'effect/Scope';
import * as Stream from 'effect/Stream';
import * as SubscriptionRef from 'effect/SubscriptionRef';
import { AppState } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Workload } from '../../@generic/service/workload.service';
import { isAiEnabled } from '../../@generic/utils/is-ai-enabled.util';
import { waitForIdle } from '../../@generic/utils/wait-for-idle.util';
import { aiAtomRegistry } from '../constant/ai-atom-registry.constant';
import { AiCoordinatorSnapshotInterface } from '../interface/ai-coordinator-snapshot.interface';
import { embeddingProgressStore } from '../store/embedding-progress.store';
import { translationProgressStore } from '../store/translation-progress.store';
import { BACKGROUND_RELEASE_DELAY_MS } from '../util/ai-constants.util';
import { patchAtom } from '../utils/patch-atom.util';

import { aiModelResidencyService } from './ai-model-residency.service';
import { chatService } from './chat.service';
import { embeddingDrainerService } from './embedding-drainer.service';
import { translationDrainerService } from './translation-drainer.service';

import type { Db } from '@budgie/contracts';
import type { AppStateStatus } from 'react-native';

class AiCoordinatorService {
    private static readonly DRAINER_IDLE_GRACE_MS = 5_000;
    private static readonly DRAINER_ABORT_GRACE_MS = 2_000;
    private static readonly DRAINERS = [translationDrainerService, ...embeddingDrainerService.drainers];

    readonly snapshot = Atom.keepAlive(Atom.make<AiCoordinatorSnapshotInterface>({ isAvailable: isAiEnabled(), isSuspended: false }));

    readonly start = Effect.fn('AiCoordinatorService.start')(function* (this: AiCoordinatorService) {
        if (isDefined(this.scope) || !aiAtomRegistry.get(this.snapshot).isAvailable) {
            return;
        }
        const scope = yield* Scope.make();
        this.scope = scope;
        const run = yield* Scope.provide(FiberSet.makeRuntime<Db>(), scope);
        const releaseTimer = yield* Scope.provide(FiberHandle.make(), scope);
        yield* Scope.provide(
            Effect.acquireRelease(
                Effect.sync(() =>
                    AppState.addEventListener('change', state => {
                        run(this.handleAppStateChange(state, releaseTimer));
                    })
                ),
                subscription =>
                    Effect.sync(() => {
                        subscription.remove();
                    })
            ),
            scope
        );
        yield* Effect.forkIn(
            Stream.runForEach(SubscriptionRef.changes((yield* Workload).foregroundCount), count =>
                Effect.forEach(AiCoordinatorService.DRAINERS, drainer => drainer.setForegroundBusy(count > 0), { discard: true })
            ),
            scope
        );

        const isSuspended = AppState.currentState !== 'active' && AppState.currentState !== 'unknown';
        patchAtom(this.snapshot, { isSuspended });
        if (!isSuspended) {
            run(this.startSubsystemsWhenIdle());
        }
    });

    readonly stop = Effect.fn('AiCoordinatorService.stop')(function* (this: AiCoordinatorService) {
        const { scope } = this;
        if (!isDefined(scope)) {
            return;
        }
        this.scope = null;
        yield* Scope.close(scope, Exit.void);
        yield* Effect.forkDetach(this.stopSubsystems());
    });

    private readonly handleAppStateChange = Effect.fn('AiCoordinatorService.handleAppStateChange')(function* (
        this: AiCoordinatorService,
        state: AppStateStatus,
        releaseTimer: FiberHandle.FiberHandle
    ) {
        if (state !== 'active') {
            AiCoordinatorService.DRAINERS.forEach(drainer => {
                drainer.halt();
                drainer.cancelBoost();
            });
            yield* FiberHandle.run(releaseTimer, this.releaseAfterDelay(), { onlyIfMissing: true });

            return;
        }
        yield* FiberHandle.clear(releaseTimer);
        yield* Effect.forEach(AiCoordinatorService.DRAINERS, drainer => drainer.schedule(), { discard: true });
        if (aiAtomRegistry.get(this.snapshot).isSuspended) {
            patchAtom(this.snapshot, { isSuspended: false });
            yield* this.startSubsystemsWhenIdle();
        }
    });

    private readonly releaseAfterDelay = Effect.fn('AiCoordinatorService.releaseAfterDelay')(function* (this: AiCoordinatorService) {
        yield* Effect.sleep(BACKGROUND_RELEASE_DELAY_MS);
        patchAtom(this.snapshot, { isSuspended: true });
        yield* Effect.forkDetach(this.stopSubsystems());
    });

    private readonly startSubsystemsWhenIdle = Effect.fn('AiCoordinatorService.startSubsystemsWhenIdle')(
        function* (this: AiCoordinatorService) {
            yield* waitForIdle;
            if (!this.isActive()) {
                return;
            }
            yield* aiModelResidencyService.resume();
            yield* translationDrainerService.start();
            yield* embeddingDrainerService.start();
            yield* translationProgressStore.refresh();
            yield* embeddingProgressStore.refresh();
        }
    );

    private readonly stopSubsystems = Effect.fn('AiCoordinatorService.stopSubsystems')(function* (this: AiCoordinatorService) {
        AiCoordinatorService.DRAINERS.forEach(drainer => {
            drainer.stop();
        });
        const idle = Effect.forEach(AiCoordinatorService.DRAINERS, drainer => drainer.whenIdle(), {
            concurrency: 'unbounded',
            discard: true
        });
        yield* idle.pipe(
            Effect.timeout(AiCoordinatorService.DRAINER_IDLE_GRACE_MS),
            Effect.catch(() =>
                Effect.sync(() => {
                    chatService.interrupt();
                }).pipe(Effect.andThen(idle), Effect.timeout(AiCoordinatorService.DRAINER_ABORT_GRACE_MS), Effect.ignore)
            )
        );
        if (this.isActive()) {
            return;
        }
        yield* aiModelResidencyService.suspend();
    });

    private scope: Scope.Closeable | null = null;

    private isActive(): boolean {
        return isDefined(this.scope) && !aiAtomRegistry.get(this.snapshot).isSuspended;
    }
}

export const aiCoordinatorService = new AiCoordinatorService();
