import { Log } from '@budgie/contracts';
import { t } from '@lingui/core/macro';

import { getErrorMessage } from '@rnw-community/shared';

import { commentEmbeddingRepository, merchantEmbeddingRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { AiSubsystemStatusSnapshotInterface } from '../interface/ai-subsystem-status-snapshot.interface';
import { embeddingProgressStore } from '../store/embedding-progress.store';
import { buildSubsystemSnapshot } from '../utils/build-subsystem-snapshot.util';

import { BaseSubsystemStatusService, EMPTY_SUBSYSTEM_SNAPSHOT } from './base-subsystem-status.service';
import { embeddingDrainerService } from './embedding-drainer.service';

class AiEmbeddingStatusService extends BaseSubsystemStatusService {
    @Log(() => 'enter', () => 'done', error => `throw error=${getErrorMessage(error)}`)
    async rebuild(): Promise<void> {
        try {
            await this.pauseDrainer();
            try {
                await this.truncateEmbeddings();
                await this.markTransactions();
            } finally {
                embeddingDrainerService.resume();
            }
            void embeddingProgressStore.refresh();
            await embeddingDrainerService.boost();
        } catch (error: unknown) {
            embeddingDrainerService.resume();
            throw error;
        }
    }
    @Log(() => 'enter', () => 'done', error => `throw error=${getErrorMessage(error)}`)
    private async pauseDrainer(): Promise<void> {
        await embeddingDrainerService.pause();
    }
    @Log(() => 'enter', () => 'done', error => `throw error=${getErrorMessage(error)}`)
    private async truncateEmbeddings(): Promise<void> {
        await merchantEmbeddingRepository.truncate();
        await commentEmbeddingRepository.truncate();
    }
    @Log(() => 'enter', () => 'done', error => `throw error=${getErrorMessage(error)}`)
    private async markTransactions(): Promise<void> {
        await transactionRepository.markAllForEmbedding();
        await transactionRepository.clearNonIndexableFlags();
    }

    protected buildSubsystemSubscriptions(): (() => void)[] {
        return [embeddingDrainerService.subscribe(this.scheduleRecompute), embeddingProgressStore.subscribe(this.scheduleRecompute)];
    }

    protected derive(): AiSubsystemStatusSnapshotInterface {
        if (!this.isUmbrellaHealthy()) {
            return EMPTY_SUBSYSTEM_SNAPSHOT;
        }

        return buildSubsystemSnapshot(embeddingDrainerService.getSnapshot(), embeddingProgressStore.getSnapshot(), {
            boosting: t`Rebuilding learning`,
            working: t`Learning transactions`,
            ready: t`Learning up to date`
        });
    }
}

export const aiEmbeddingStatusService = new AiEmbeddingStatusService();
