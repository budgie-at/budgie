import { Log } from '@budgie/logger';
import { AppState } from 'react-native';

import { emptyFn, getErrorMessage, isDefined } from '@rnw-community/shared';

import { isAiEnabled } from '../../@generic/utils/is-ai-enabled.util';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { scheduleIdleCallback } from '../../@generic/utils/schedule-idle-callback.util';
import { AiCoordinatorSnapshotInterface } from '../interface/ai-coordinator-snapshot.interface';
import { embeddingProgressStore } from '../store/embedding-progress.store';
import { translationProgressStore } from '../store/translation-progress.store';
import { BACKGROUND_RELEASE_DELAY_MS } from '../util/ai-constants.util';

import { aiEmbeddingStatusService } from './ai-embedding-status.service';
import { aiModelResidencyService } from './ai-model-residency.service';
import { aiTranslationStatusService } from './ai-translation-status.service';
import { aiUmbrellaStatusService } from './ai-umbrella-status.service';
import { SnapshotStore } from './base-subsystem.service';
import { chatService } from './chat.service';
import { embeddingDrainerService } from './embedding-drainer.service';
import { translationDrainerService } from './translation-drainer.service';

import type { AppStateStatus } from 'react-native';

class AiCoordinatorService extends SnapshotStore<AiCoordinatorSnapshotInterface> {
    private static readonly DRAINER_IDLE_GRACE_MS = 5_000;
    private static readonly DRAINER_ABORT_GRACE_MS = 2_000;

    private started = false;
    private releaseTimer: ReturnType<typeof setTimeout> | null = null;
    private appStateSubscription: { remove: () => void } | null = null;
    private scheduledStartCancel: (() => void) | null = null;

    constructor() {
        super({ isAvailable: isAiEnabled(), isSuspended: false });
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`) start(): void {
        if (this.started) {
            return;
        }
        this.started = true;

        if (!this.snapshot.isAvailable) {
            return;
        }

        this.appStateSubscription = AppState.addEventListener('change', state => {
            this.handleAppStateChange(state);
        });

        const { currentState } = AppState;
        if (currentState === 'active' || currentState === 'unknown') {
            this.setSnapshot({ isSuspended: false });
            this.scheduleStartSubsystems();
        } else {
            this.setSnapshot({ isSuspended: true });
        }
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`) stop(): void {
        if (!this.started) {
            return;
        }
        this.started = false;
        this.cancelScheduledStart();
        this.clearReleaseTimer();
        this.appStateSubscription?.remove();
        this.appStateSubscription = null;
        void this.stopSubsystems().catch(emptyFn);
    }

    @Log(
        state => `enter state=${state}`,
        (result, state) => `done state=${state} result=${String(result)}`,
        (error, state) => `throw state=${state} error=${getErrorMessage(error)}`
    )
    private handleAppStateChange(state: AppStateStatus): void {
        if (state === 'active') {
            if (isDefined(this.releaseTimer)) {
                this.clearReleaseTimer();
            }
            if (this.snapshot.isSuspended) {
                this.setSnapshot({ isSuspended: false });
                this.scheduleStartSubsystems();
            }

            return;
        }

        if (isDefined(this.releaseTimer)) {
            return;
        }
        this.releaseTimer = setTimeout(() => {
            this.handleReleaseTimer();
        }, BACKGROUND_RELEASE_DELAY_MS);
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    private handleReleaseTimer(): void {
        this.releaseTimer = null;
        this.cancelScheduledStart();
        this.setSnapshot({ isSuspended: true });
        void this.stopSubsystems().catch(emptyFn);
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    private startSubsystems(): void {
        if (!this.started || this.snapshot.isSuspended) {
            return;
        }

        aiModelResidencyService.resume();
        translationDrainerService.start();
        embeddingDrainerService.start();
        aiUmbrellaStatusService.start();
        aiTranslationStatusService.start();
        aiEmbeddingStatusService.start();
        void translationProgressStore.refresh();
        void embeddingProgressStore.refresh(true);
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    private async stopSubsystems(): Promise<void> {
        aiEmbeddingStatusService.stop();
        aiTranslationStatusService.stop();
        aiUmbrellaStatusService.stop();
        translationDrainerService.stop();
        embeddingDrainerService.stop();
        await this.settleInFlightBatches();
        await aiModelResidencyService.suspend();
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    private async settleInFlightBatches(): Promise<void> {
        const idle = Promise.all([translationDrainerService.whenIdle(), embeddingDrainerService.whenIdle()]);
        const isSettled = await Promise.race([
            idle.then(() => true),
            microPause(AiCoordinatorService.DRAINER_IDLE_GRACE_MS).then(() => false)
        ]);
        if (isSettled) {
            return;
        }
        chatService.interrupt();
        await Promise.race([idle, microPause(AiCoordinatorService.DRAINER_ABORT_GRACE_MS)]);
    }

    private scheduleStartSubsystems(): void {
        this.cancelScheduledStart();
        this.scheduledStartCancel = scheduleIdleCallback(() => {
            this.scheduledStartCancel = null;
            this.startSubsystems();
        });
    }

    private cancelScheduledStart(): void {
        if (isDefined(this.scheduledStartCancel)) {
            this.scheduledStartCancel();
            this.scheduledStartCancel = null;
        }
    }

    private clearReleaseTimer(): void {
        if (isDefined(this.releaseTimer)) {
            clearTimeout(this.releaseTimer);
            this.releaseTimer = null;
        }
    }
}

export const aiCoordinatorService = new AiCoordinatorService();
