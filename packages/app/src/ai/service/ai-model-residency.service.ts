import { Log } from '@budgie/logger';

import { emptyFn, getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { SnapshotWithStatusInterface } from '../interface/snapshot-with-status.interface';
import { MODEL_IDLE_RELEASE_DELAY_MS } from '../util/ai-constants.util';

import { BaseSubsystemService } from './base-subsystem.service';
import { chatService } from './chat.service';
import { embeddingService } from './embedding.service';
import { sttService } from './stt.service';

class AiModelResidencyService {
    private static readonly SUBSYSTEMS: Record<AiSubsystemNameEnum, BaseSubsystemService<SnapshotWithStatusInterface>> = {
        [AiSubsystemNameEnum.CHAT]: chatService,
        [AiSubsystemNameEnum.EMBEDDING]: embeddingService,
        [AiSubsystemNameEnum.STT]: sttService
    };

    private readonly leases = new Map<AiSubsystemNameEnum, number>();
    private readonly idleTimers = new Map<AiSubsystemNameEnum, ReturnType<typeof setTimeout>>();
    private residencyChain: Promise<void> = Promise.resolve();
    private isSuspended = false;

    @Log(
        subsystem => `enter subsystem=${subsystem}`,
        (result, subsystem) => `done subsystem=${subsystem} isReady=${String(result)}`,
        (error, subsystem) => `throw subsystem=${subsystem} error=${getErrorMessage(error)}`
    )
    async acquire(subsystem: AiSubsystemNameEnum): Promise<boolean> {
        this.clearIdleTimer(subsystem);
        this.leases.set(subsystem, this.getLeaseCount(subsystem) + 1);

        return this.ensureLoaded(subsystem);
    }

    @Log(
        subsystem => `enter subsystem=${subsystem}`,
        (result, subsystem) => `done subsystem=${subsystem} result=${String(result)}`,
        (error, subsystem) => `throw subsystem=${subsystem} error=${getErrorMessage(error)}`
    )
    release(subsystem: AiSubsystemNameEnum): void {
        const remaining = Math.max(0, this.getLeaseCount(subsystem) - 1);
        this.leases.set(subsystem, remaining);
        if (isPositiveNumber(remaining)) {
            return;
        }
        this.clearIdleTimer(subsystem);
        this.idleTimers.set(
            subsystem,
            setTimeout(() => {
                this.idleTimers.delete(subsystem);
                void this.chain(() => this.unloadWhileUnleased(subsystem));
            }, MODEL_IDLE_RELEASE_DELAY_MS)
        );
    }

    @Log(
        subsystem => `enter subsystem=${subsystem}`,
        (result, subsystem) => `done subsystem=${subsystem} result=${String(result)}`,
        (error, subsystem) => `throw subsystem=${subsystem} error=${getErrorMessage(error)}`
    )
    releaseNow(subsystem: AiSubsystemNameEnum): void {
        this.leases.set(subsystem, Math.max(0, this.getLeaseCount(subsystem) - 1));
        this.clearIdleTimer(subsystem);
        void this.chain(() => this.unloadWhileUnleased(subsystem));
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async suspend(): Promise<void> {
        this.isSuspended = true;
        Object.values(AiSubsystemNameEnum).forEach(subsystem => {
            this.clearIdleTimer(subsystem);
        });
        await this.chain(() => this.unloadAll());
    }

    @Log(
        subsystem => `enter subsystem=${subsystem}`,
        (result, subsystem) => `done subsystem=${subsystem} result=${String(result)}`,
        (error, subsystem) => `throw subsystem=${subsystem} error=${getErrorMessage(error)}`
    )
    async retry(subsystem: AiSubsystemNameEnum): Promise<void> {
        await this.chain(async () => {
            await AiModelResidencyService.SUBSYSTEMS[subsystem].resetError();
            await this.loadWhileLeased(subsystem);
        });
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    resume(): void {
        this.isSuspended = false;
        Object.values(AiSubsystemNameEnum).forEach(subsystem => {
            void this.chain(() => this.loadWhileLeased(subsystem));
        });
    }

    @Log(
        subsystem => `enter subsystem=${subsystem}`,
        (result, subsystem) => `done subsystem=${subsystem} isReady=${String(result)}`,
        (error, subsystem) => `throw subsystem=${subsystem} error=${getErrorMessage(error)}`
    )
    private async ensureLoaded(subsystem: AiSubsystemNameEnum): Promise<boolean> {
        const service = AiModelResidencyService.SUBSYSTEMS[subsystem];
        if (this.isSuspended || service.getSnapshot().status === AiSubsystemStatusEnum.ERROR) {
            return false;
        }
        await this.chain(() => this.loadWhileLeased(subsystem));

        return service.isReady;
    }

    @Log(
        subsystem => `enter subsystem=${subsystem}`,
        (result, subsystem) => `done subsystem=${subsystem} result=${String(result)}`,
        (error, subsystem) => `throw subsystem=${subsystem} error=${getErrorMessage(error)}`
    )
    private async loadWhileLeased(subsystem: AiSubsystemNameEnum): Promise<void> {
        if (this.isSuspended || !isPositiveNumber(this.getLeaseCount(subsystem))) {
            return;
        }
        await AiModelResidencyService.SUBSYSTEMS[subsystem].start();
    }

    @Log(
        subsystem => `enter subsystem=${subsystem}`,
        (result, subsystem) => `done subsystem=${subsystem} result=${String(result)}`,
        (error, subsystem) => `throw subsystem=${subsystem} error=${getErrorMessage(error)}`
    )
    private async unloadWhileUnleased(subsystem: AiSubsystemNameEnum): Promise<void> {
        if (isPositiveNumber(this.getLeaseCount(subsystem))) {
            return;
        }
        await AiModelResidencyService.SUBSYSTEMS[subsystem].stop();
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    private async unloadAll(): Promise<void> {
        await Promise.all(Object.values(AiModelResidencyService.SUBSYSTEMS).map(service => service.stop()));
    }

    private chain(operation: () => Promise<void>): Promise<void> {
        this.residencyChain = this.residencyChain.then(operation, operation).catch(emptyFn);

        return this.residencyChain;
    }

    private getLeaseCount(subsystem: AiSubsystemNameEnum): number {
        return this.leases.get(subsystem) ?? 0;
    }

    private clearIdleTimer(subsystem: AiSubsystemNameEnum): void {
        const timer = this.idleTimers.get(subsystem);
        if (isDefined(timer)) {
            clearTimeout(timer);
            this.idleTimers.delete(subsystem);
        }
    }
}

export const aiModelResidencyService = new AiModelResidencyService();
