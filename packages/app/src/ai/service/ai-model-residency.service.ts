import * as Effect from 'effect/Effect';
import * as Semaphore from 'effect/Semaphore';

import { isPositiveNumber } from '@rnw-community/shared';

import { isAiEnabled } from '../../@generic/utils/is-ai-enabled.util';
import { aiAtomRegistry } from '../constant/ai-atom-registry.constant';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiSubsystemServiceInterface } from '../interface/ai-subsystem-service.interface';
import { MODEL_IDLE_RELEASE_DELAY_MS } from '../util/ai-constants.util';

import { chatService } from './chat.service';
import { embeddingService } from './embedding.service';
import { sttService } from './stt.service';

import type * as Fiber from 'effect/Fiber';

class AiModelResidencyService {
    private static readonly SUBSYSTEMS: Record<AiSubsystemNameEnum, AiSubsystemServiceInterface> = {
        [AiSubsystemNameEnum.CHAT]: chatService.model,
        [AiSubsystemNameEnum.EMBEDDING]: embeddingService.model,
        [AiSubsystemNameEnum.STT]: sttService
    };

    readonly acquire = Effect.fn('AiModelResidencyService.acquire')(function* (
        this: AiModelResidencyService,
        subsystem: AiSubsystemNameEnum
    ) {
        this.clearIdleTimer(subsystem);
        this.leases.set(subsystem, this.getLeaseCount(subsystem) + 1);
        if (!isAiEnabled() || this.isSuspended || this.getStatus(subsystem) === AiSubsystemStatusEnum.ERROR) {
            return false;
        }
        yield* this.lock.withPermit(this.loadWhileLeased(subsystem));

        return this.getStatus(subsystem) === AiSubsystemStatusEnum.READY;
    });

    readonly release = Effect.fn('AiModelResidencyService.release')(function* (
        this: AiModelResidencyService,
        subsystem: AiSubsystemNameEnum
    ) {
        const remaining = Math.max(0, this.getLeaseCount(subsystem) - 1);
        this.leases.set(subsystem, remaining);
        if (isPositiveNumber(remaining)) {
            return;
        }
        this.clearIdleTimer(subsystem);
        this.idleTimers.set(
            subsystem,
            yield* Effect.forkDetach(
                Effect.delay(Effect.uninterruptible(this.lock.withPermit(this.unloadWhileUnleased(subsystem))), MODEL_IDLE_RELEASE_DELAY_MS)
            )
        );
    });

    readonly releaseNow = Effect.fn('AiModelResidencyService.releaseNow')(function* (
        this: AiModelResidencyService,
        subsystem: AiSubsystemNameEnum
    ) {
        this.leases.set(subsystem, Math.max(0, this.getLeaseCount(subsystem) - 1));
        this.clearIdleTimer(subsystem);
        yield* this.lock.withPermit(this.unloadWhileUnleased(subsystem));
    });

    readonly suspend = Effect.fn('AiModelResidencyService.suspend')(function* (this: AiModelResidencyService) {
        this.isSuspended = true;
        Object.values(AiSubsystemNameEnum).forEach(subsystem => {
            this.clearIdleTimer(subsystem);
        });
        yield* this.lock.withPermit(
            Effect.forEach(Object.values(AiModelResidencyService.SUBSYSTEMS), service => service.stop(), {
                concurrency: 'unbounded',
                discard: true
            })
        );
    });

    readonly retry = Effect.fn('AiModelResidencyService.retry')(function* (this: AiModelResidencyService, subsystem: AiSubsystemNameEnum) {
        yield* this.lock.withPermit(
            Effect.andThen(AiModelResidencyService.SUBSYSTEMS[subsystem].resetError(), this.loadWhileLeased(subsystem))
        );
    });

    readonly resume = Effect.fn('AiModelResidencyService.resume')(function* (this: AiModelResidencyService) {
        this.isSuspended = false;
        yield* Effect.forkDetach(
            Effect.forEach(Object.values(AiSubsystemNameEnum), subsystem => this.lock.withPermit(this.loadWhileLeased(subsystem)), {
                discard: true
            })
        );
    });

    private readonly loadWhileLeased = Effect.fn('AiModelResidencyService.loadWhileLeased')(function* (
        this: AiModelResidencyService,
        subsystem: AiSubsystemNameEnum
    ) {
        if (!isAiEnabled() || this.isSuspended || !isPositiveNumber(this.getLeaseCount(subsystem))) {
            return;
        }
        if (this.getStatus(subsystem) !== AiSubsystemStatusEnum.ERROR) {
            yield* AiModelResidencyService.SUBSYSTEMS[subsystem].start();
        }
    });

    private readonly unloadWhileUnleased = Effect.fn('AiModelResidencyService.unloadWhileUnleased')(function* (
        this: AiModelResidencyService,
        subsystem: AiSubsystemNameEnum
    ) {
        if (!isPositiveNumber(this.getLeaseCount(subsystem))) {
            yield* AiModelResidencyService.SUBSYSTEMS[subsystem].stop();
        }
    });

    private readonly leases = new Map<AiSubsystemNameEnum, number>();
    private readonly idleTimers = new Map<AiSubsystemNameEnum, Fiber.Fiber<void>>();
    private readonly lock = Semaphore.makeUnsafe(1);
    private isSuspended = false;

    private getLeaseCount(subsystem: AiSubsystemNameEnum): number {
        return this.leases.get(subsystem) ?? 0;
    }

    private getStatus(subsystem: AiSubsystemNameEnum): AiSubsystemStatusEnum {
        return aiAtomRegistry.get(AiModelResidencyService.SUBSYSTEMS[subsystem].snapshot).status;
    }

    private clearIdleTimer(subsystem: AiSubsystemNameEnum): void {
        this.idleTimers.get(subsystem)?.interruptUnsafe();
        this.idleTimers.delete(subsystem);
    }
}

export const aiModelResidencyService = new AiModelResidencyService();
