import { Log, getLogger } from '@budgie/logger';
import { AppState, AppStateStatus } from 'react-native';

import { emptyFn, getErrorMessage, isDefined } from '@rnw-community/shared';

import { isAiEnabled } from '../../@generic/utils/is-ai-enabled.util';
import { AiCoordinatorSnapshotInterface } from '../interface/ai-coordinator-snapshot.interface';
import { embeddingProgressStore } from '../store/embedding-progress.store';
import { translationProgressStore } from '../store/translation-progress.store';
import { BACKGROUND_RELEASE_DELAY_MS } from '../util/ai-constants.util';

import { aiEmbeddingStatusService } from './ai-embedding-status.service';
import { aiTranslationStatusService } from './ai-translation-status.service';
import { aiUmbrellaStatusService } from './ai-umbrella-status.service';
import { SnapshotStore } from './base-subsystem.service';
import { chatService } from './chat.service';
import { embeddingDrainerService } from './embedding-drainer.service';
import { embeddingService } from './embedding.service';
import { sttService } from './stt.service';
import { translationDrainerService } from './translation-drainer.service';
const logger = getLogger('AiCoordinatorService');

class AiCoordinatorService extends SnapshotStore<AiCoordinatorSnapshotInterface> {
    private started = false;
    private releaseTimer: ReturnType<typeof setTimeout> | null = null;
    private appStateSubscription: { remove: () => void } | null = null;

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

        this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

        const { currentState } = AppState;
        if (currentState === 'active' || currentState === 'unknown') {
            this.setSnapshot({ isSuspended: false });
            void this.startSubsystems().catch(emptyFn);
        } else {
            this.setSnapshot({ isSuspended: true });
        }
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`) stop(): void {
        if (!this.started) {
            return;
        }
        this.started = false;
        this.clearReleaseTimer();
        this.appStateSubscription?.remove();
        this.appStateSubscription = null;
        void this.stopSubsystems().catch(emptyFn);
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    private async bootModels(): Promise<void> {
        await Promise.all([chatService.start(), embeddingService.start()]);
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    private async releaseModels(): Promise<void> {
        await Promise.all([chatService.stop(), embeddingService.stop(), sttService.stop()]);
    }

    // eslint-disable-next-line max-statements -- AppState handler: foreground/background branches with timer control
    private readonly handleAppStateChange = (state: AppStateStatus): void => {
        logger.log('appstate:change', { to: state });
        if (state === 'active') {
            if (isDefined(this.releaseTimer)) {
                logger.log('release:cancel');
                this.clearReleaseTimer();
            }
            if (this.snapshot.isSuspended) {
                this.setSnapshot({ isSuspended: false });
                void this.startSubsystems().catch(emptyFn);
            }

            return;
        }

        if (isDefined(this.releaseTimer)) {
            return;
        }
        logger.log('release:schedule', { delayMs: BACKGROUND_RELEASE_DELAY_MS });
        this.releaseTimer = setTimeout(() => {
            this.releaseTimer = null;
            logger.log('release:fire');
            this.setSnapshot({ isSuspended: true });
            void this.stopSubsystems().catch(emptyFn);
        }, BACKGROUND_RELEASE_DELAY_MS);
    };

    private async startSubsystems(): Promise<void> {
        await this.bootModels();
        translationDrainerService.start();
        embeddingDrainerService.start();
        aiUmbrellaStatusService.start();
        aiTranslationStatusService.start();
        aiEmbeddingStatusService.start();
        void translationProgressStore.refresh();
        void embeddingProgressStore.refresh(true);
    }

    private async stopSubsystems(): Promise<void> {
        aiEmbeddingStatusService.stop();
        aiTranslationStatusService.stop();
        aiUmbrellaStatusService.stop();
        translationDrainerService.stop();
        embeddingDrainerService.stop();
        await this.releaseModels();
    }

    private clearReleaseTimer(): void {
        if (isDefined(this.releaseTimer)) {
            clearTimeout(this.releaseTimer);
            this.releaseTimer = null;
        }
    }
}

export const aiCoordinatorService = new AiCoordinatorService();
