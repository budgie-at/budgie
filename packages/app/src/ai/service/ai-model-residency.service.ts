import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Semaphore from 'effect/Semaphore';

import { isPositiveNumber } from '@rnw-community/shared';

import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiSubsystemServiceInterface } from '../interface/ai-subsystem-service.interface';
import { MODEL_IDLE_RELEASE_DELAY_MS } from '../util/ai-constants.util';
import { isAiRuntimeActive } from '../utils/is-ai-runtime-active.util';

import { ChatService } from './chat.service';
import { LocalEmbeddingService } from './embedding.service';
import { SttService } from './stt.service';

import type { NativeCallError } from '../../@generic/error/native-call.error';
import type * as Fiber from 'effect/Fiber';

export class AiModelResidencyService extends Context.Service<AiModelResidencyService>()('@budgie/app/AiModelResidencyService', {
    make: Effect.gen(function* () {
        const chatService = yield* ChatService;
        const localEmbeddingService = yield* LocalEmbeddingService;
        const sttService = yield* SttService;
        const layerScope = yield* Effect.scope;
        const subsystems: Record<AiSubsystemNameEnum, AiSubsystemServiceInterface> = {
            [AiSubsystemNameEnum.CHAT]: chatService.model,
            [AiSubsystemNameEnum.EMBEDDING]: localEmbeddingService.model,
            [AiSubsystemNameEnum.STT]: sttService
        };
        const leases = new Map<AiSubsystemNameEnum, number>();
        const idleTimers = new Map<AiSubsystemNameEnum, Fiber.Fiber<void, NativeCallError>>();
        const lock = yield* Semaphore.make(1);
        let isSuspended = true;

        const getLeaseCount = (subsystem: AiSubsystemNameEnum): number => leases.get(subsystem) ?? 0;

        const getStatus = (subsystem: AiSubsystemNameEnum): AiSubsystemStatusEnum =>
            appAtomRegistry.get(subsystems[subsystem].snapshot).status;

        const clearIdleTimer = (subsystem: AiSubsystemNameEnum): void => {
            idleTimers.get(subsystem)?.interruptUnsafe();
            idleTimers.delete(subsystem);
        };

        const loadWhileLeased = Effect.fn('AiModelResidencyService.loadWhileLeased')(function* (subsystem: AiSubsystemNameEnum) {
            if (!isAiRuntimeActive() || isSuspended || !isPositiveNumber(getLeaseCount(subsystem))) {
                return;
            }
            if (getStatus(subsystem) !== AiSubsystemStatusEnum.ERROR) {
                yield* subsystems[subsystem].start();
            }
        });

        const unloadWhileUnleased = Effect.fn('AiModelResidencyService.unloadWhileUnleased')(function* (subsystem: AiSubsystemNameEnum) {
            if (!isPositiveNumber(getLeaseCount(subsystem))) {
                yield* subsystems[subsystem].stop();
            }
        });

        return {
            acquire: Effect.fn('AiModelResidencyService.acquire')(function* (subsystem: AiSubsystemNameEnum) {
                clearIdleTimer(subsystem);
                leases.set(subsystem, getLeaseCount(subsystem) + 1);
                if (!isAiRuntimeActive() || isSuspended || getStatus(subsystem) === AiSubsystemStatusEnum.ERROR) {
                    return false;
                }
                yield* lock.withPermit(Effect.uninterruptible(loadWhileLeased(subsystem)));

                return getStatus(subsystem) === AiSubsystemStatusEnum.READY;
            }),
            release: Effect.fn('AiModelResidencyService.release')(function* (subsystem: AiSubsystemNameEnum) {
                const remaining = Math.max(0, getLeaseCount(subsystem) - 1);
                leases.set(subsystem, remaining);
                if (isPositiveNumber(remaining)) {
                    return;
                }
                clearIdleTimer(subsystem);
                idleTimers.set(
                    subsystem,
                    yield* Effect.forkIn(
                        Effect.delay(Effect.uninterruptible(lock.withPermit(unloadWhileUnleased(subsystem))), MODEL_IDLE_RELEASE_DELAY_MS),
                        layerScope
                    )
                );
            }),
            releaseNow: Effect.fn('AiModelResidencyService.releaseNow')(function* (subsystem: AiSubsystemNameEnum) {
                leases.set(subsystem, Math.max(0, getLeaseCount(subsystem) - 1));
                clearIdleTimer(subsystem);
                yield* lock.withPermit(unloadWhileUnleased(subsystem));
            }),
            suspend: Effect.fn('AiModelResidencyService.suspend')(function* () {
                isSuspended = true;
                Object.values(AiSubsystemNameEnum).forEach(subsystem => {
                    clearIdleTimer(subsystem);
                });
                yield* lock.withPermit(
                    Effect.forEach(Object.values(subsystems), service => service.stop(), {
                        concurrency: 'unbounded',
                        discard: true
                    })
                );
            }),
            resume: Effect.fn('AiModelResidencyService.resume')(function* () {
                isSuspended = false;
                yield* Effect.forkIn(
                    Effect.forEach(
                        Object.values(AiSubsystemNameEnum),
                        subsystem => lock.withPermit(Effect.uninterruptible(loadWhileLeased(subsystem))),
                        {
                            discard: true
                        }
                    ),
                    layerScope
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(AiModelResidencyService, AiModelResidencyService.make).pipe(
        Layer.provide([ChatService.layer, LocalEmbeddingService.layer, SttService.layer])
    );
}
