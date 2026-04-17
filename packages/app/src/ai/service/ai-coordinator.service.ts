import { AppState, AppStateStatus } from 'react-native';

import { getErrorMessage } from '@rnw-community/shared';

import { isAiEnabled } from '../../@generic/utils/is-ai-enabled.util';
import { AiCoordinatorSnapshotInterface } from '../interface/ai-coordinator-snapshot.interface';
import { BACKGROUND_RELEASE_DELAY_MS } from '../util/ai-constants.util';
import { aiLog } from '../utils/ai-log.util';

import { chatService } from './chat.service';
import { embeddingDrainerService } from './embedding-drainer.service';
import { embeddingService } from './embedding.service';
import { sttService } from './stt.service';

class AiCoordinatorService {
    private started = false;
    private snapshot: AiCoordinatorSnapshotInterface = {
        isAvailable: isAiEnabled(),
        isSuspended: false
    };
    private releaseTimer: ReturnType<typeof setTimeout> | null = null;
    private appStateSubscription: { remove: () => void } | null = null;
    private listeners = new Set<() => void>();

    readonly subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    };

    readonly getSnapshot = (): AiCoordinatorSnapshotInterface => this.snapshot;

    start(): void {
        aiLog('coordinator:start:enter', { isAvailable: this.snapshot.isAvailable, appState: AppState.currentState });
        if (this.started) {
            return;
        }
        this.started = true;

        if (!this.snapshot.isAvailable) {
            aiLog('coordinator:start:skip:disabled');

            return;
        }

        this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

        const currentState = AppState.currentState;
        if (currentState === 'active' || currentState === 'unknown') {
            this.setSnapshot({ isSuspended: false });
            void this.startSubsystems();
        } else {
            this.setSnapshot({ isSuspended: true });
        }
    }

    stop(): void {
        aiLog('coordinator:stop:enter', { priorAvailable: this.snapshot.isAvailable, priorSuspended: this.snapshot.isSuspended });
        if (!this.started) {
            return;
        }
        this.started = false;
        this.clearReleaseTimer();
        this.appStateSubscription?.remove();
        this.appStateSubscription = null;
        void this.stopSubsystems();
    }

    private readonly handleAppStateChange = (state: AppStateStatus): void => {
        aiLog('coordinator:appstate:change', { to: state });
        if (state === 'active') {
            if (this.releaseTimer !== null) {
                aiLog('coordinator:release:cancel');
                this.clearReleaseTimer();
            }
            if (this.snapshot.isSuspended) {
                this.setSnapshot({ isSuspended: false });
                void this.startSubsystems();
            }

            return;
        }

        if (this.releaseTimer !== null) {
            return;
        }
        aiLog('coordinator:release:schedule', { delayMs: BACKGROUND_RELEASE_DELAY_MS });
        this.releaseTimer = setTimeout(() => {
            this.releaseTimer = null;
            aiLog('coordinator:release:fire');
            this.setSnapshot({ isSuspended: true });
            void this.stopSubsystems();
        }, BACKGROUND_RELEASE_DELAY_MS);
    };

    private async startSubsystems(): Promise<void> {
        const started = Date.now();
        aiLog('coordinator:subsystems:start:begin');
        try {
            await Promise.all([chatService.start(), embeddingService.start()]);
        } catch (error: unknown) {
            aiLog('coordinator:subsystems:start:error', { errorMessage: getErrorMessage(error) });
        }
        embeddingDrainerService.start();
        aiLog('coordinator:subsystems:start:complete', {
            durationMs: Date.now() - started,
            chatStatus: chatService.getSnapshot().status,
            embeddingStatus: embeddingService.getSnapshot().status
        });
    }

    private async stopSubsystems(): Promise<void> {
        const started = Date.now();
        aiLog('coordinator:subsystems:stop:begin');
        embeddingDrainerService.stop();
        try {
            await Promise.all([chatService.stop(), embeddingService.stop(), sttService.stop()]);
        } catch (error: unknown) {
            aiLog('coordinator:subsystems:stop:error', { errorMessage: getErrorMessage(error) });
        }
        aiLog('coordinator:subsystems:stop:complete', { durationMs: Date.now() - started });
    }

    private clearReleaseTimer(): void {
        if (this.releaseTimer !== null) {
            clearTimeout(this.releaseTimer);
            this.releaseTimer = null;
        }
    }

    private setSnapshot(patch: Partial<AiCoordinatorSnapshotInterface>): void {
        this.snapshot = { ...this.snapshot, ...patch };
        this.listeners.forEach(listener => {
            listener();
        });
    }
}

export const aiCoordinatorService = new AiCoordinatorService();
