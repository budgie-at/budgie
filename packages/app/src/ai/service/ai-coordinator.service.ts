import { Log, LoggerNamespaceEnum, getLogger } from '@budgie/contracts';
import { AppState, AppStateStatus } from 'react-native';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

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

const logger = getLogger(LoggerNamespaceEnum.AI);

class AiCoordinatorService extends SnapshotStore<AiCoordinatorSnapshotInterface> {
    private started = false;
    private releaseTimer: ReturnType<typeof setTimeout> | null = null;
    private appStateSubscription: { remove: () => void } | null = null;

    constructor() {
        super({ isAvailable: isAiEnabled(), isSuspended: false });
    }

    @Log(LoggerNamespaceEnum.AI, 'coordinator:start:enter')
    start(): void {
        if (this.started) {
            return;
        }
        this.started = true;

        if (!this.snapshot.isAvailable) {
            logger.log('coordinator:start:skip:disabled');

            return;
        }

        this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

        const { currentState } = AppState;
        if (currentState === 'active' || currentState === 'unknown') {
            this.setSnapshot({ isSuspended: false });
            void this.startSubsystems();
        } else {
            this.setSnapshot({ isSuspended: true });
        }
    }

    @Log(LoggerNamespaceEnum.AI, 'coordinator:stop:enter')
    stop(): void {
        if (!this.started) {
            return;
        }
        this.started = false;
        this.clearReleaseTimer();
        this.appStateSubscription?.remove();
        this.appStateSubscription = null;
        void this.stopSubsystems();
    }

    // eslint-disable-next-line max-statements -- AppState handler: foreground/background branches with timer control
    private readonly handleAppStateChange = (state: AppStateStatus): void => {
        logger.log('coordinator:appstate:change', { to: state });
        if (state === 'active') {
            if (isDefined(this.releaseTimer)) {
                logger.log('coordinator:release:cancel');
                this.clearReleaseTimer();
            }
            if (this.snapshot.isSuspended) {
                this.setSnapshot({ isSuspended: false });
                void this.startSubsystems();
            }

            return;
        }

        if (isDefined(this.releaseTimer)) {
            return;
        }
        logger.log('coordinator:release:schedule', { delayMs: BACKGROUND_RELEASE_DELAY_MS });
        this.releaseTimer = setTimeout(() => {
            this.releaseTimer = null;
            logger.log('coordinator:release:fire');
            this.setSnapshot({ isSuspended: true });
            void this.stopSubsystems();
        }, BACKGROUND_RELEASE_DELAY_MS);
    };

    // eslint-disable-next-line max-statements -- Start sequence: model boots, drainer starts, status services start, progress refresh
    private async startSubsystems(): Promise<void> {
        const started = Date.now();
        logger.log('coordinator:subsystems:start:begin');
        try {
            await Promise.all([chatService.start(), embeddingService.start()]);
        } catch (error: unknown) {
            logger.log('coordinator:subsystems:start:error', { errorMessage: getErrorMessage(error) });
        }
        translationDrainerService.start();
        embeddingDrainerService.start();
        aiUmbrellaStatusService.start();
        aiTranslationStatusService.start();
        aiEmbeddingStatusService.start();
        void translationProgressStore.refresh();
        void embeddingProgressStore.refresh(true);
        logger.log('coordinator:subsystems:start:complete', {
            durationMs: Date.now() - started,
            chatStatus: chatService.getSnapshot().status,
            embeddingStatus: embeddingService.getSnapshot().status
        });
    }

    private async stopSubsystems(): Promise<void> {
        const started = Date.now();
        logger.log('coordinator:subsystems:stop:begin');
        aiEmbeddingStatusService.stop();
        aiTranslationStatusService.stop();
        aiUmbrellaStatusService.stop();
        translationDrainerService.stop();
        embeddingDrainerService.stop();
        try {
            await Promise.all([chatService.stop(), embeddingService.stop(), sttService.stop()]);
        } catch (error: unknown) {
            logger.log('coordinator:subsystems:stop:error', { errorMessage: getErrorMessage(error) });
        }
        logger.log('coordinator:subsystems:stop:complete', { durationMs: Date.now() - started });
    }

    private clearReleaseTimer(): void {
        if (isDefined(this.releaseTimer)) {
            clearTimeout(this.releaseTimer);
            this.releaseTimer = null;
        }
    }
}

export const aiCoordinatorService = new AiCoordinatorService();
