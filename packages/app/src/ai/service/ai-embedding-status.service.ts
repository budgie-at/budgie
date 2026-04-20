import { t } from '@lingui/core/macro';

import { getErrorMessage } from '@rnw-community/shared';

import { commentEmbeddingRepository, merchantEmbeddingRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { AiSubsystemStatusSnapshotInterface } from '../interface/ai-subsystem-status-snapshot.interface';
import { embeddingProgressStore } from '../store/embedding-progress.store';
import { aiLog } from '../utils/ai-log.util';
import { buildSubsystemSnapshot } from '../utils/build-subsystem-snapshot.util';

import { BaseSubsystemStatusService, EMPTY_SUBSYSTEM_SNAPSHOT } from './base-subsystem-status.service';
import { embeddingDrainerService } from './embedding-drainer.service';

class AiEmbeddingStatusService extends BaseSubsystemStatusService {
    // eslint-disable-next-line max-statements -- 6 rebuild phases with pause/resume bookends
    async rebuild(): Promise<void> {
        aiLog('system:action:embedding:rebuild:start');
        const started = Date.now();
        try {
            await embeddingDrainerService.pause();
            aiLog('system:action:embedding:rebuild:phase', { phase: 'paused' });
            try {
                await merchantEmbeddingRepository.truncate();
                await commentEmbeddingRepository.truncate();
                aiLog('system:action:embedding:rebuild:phase', { phase: 'embeddings-truncated' });
                await transactionRepository.markAllForEmbedding();
                await transactionRepository.clearNonIndexableFlags();
                aiLog('system:action:embedding:rebuild:phase', { phase: 'transactions-marked' });
            } finally {
                embeddingDrainerService.resume();
            }
            void embeddingProgressStore.refresh();
            await embeddingDrainerService.boost();
            aiLog('system:action:embedding:rebuild:complete', { durationMs: Date.now() - started });
        } catch (error: unknown) {
            aiLog('system:action:embedding:rebuild:throw', { errorMessage: getErrorMessage(error) });
            embeddingDrainerService.resume();
            throw error;
        }
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
