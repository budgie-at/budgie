import { LlmInterface } from '@budgie/ai';

import { emptyFn } from '@rnw-community/shared';

import { isAppActive } from '../../@generic/utils/is-app-active.util';
import { ProgressCallbackInterface } from '../interface/progress-callback.interface';
import { processCommentBatches } from '../utils/process-comment-batches.util';
import { processMerchantBatches } from '../utils/process-merchant-batches.util';

const EMBEDDING_BACKFILL_INTERVAL_MS = 15 * 60 * 1000;

const createCallbacks = (): ProgressCallbackInterface => ({
    onStep: emptyFn,
    onEmbeddingStored: emptyFn
});

class EmbeddingBackfillService {
    private isRunning = false;
    private lastStartedAt = 0;

    async runIfDue(llm: LlmInterface, onComplete: () => void): Promise<void> {
        const now = Date.now();

        if (now - this.lastStartedAt < EMBEDDING_BACKFILL_INTERVAL_MS) {
            return;
        }

        await this.run(llm, onComplete);
    }

    async run(llm: LlmInterface, onComplete: () => void): Promise<void> {
        if (!this.canRun(llm)) {
            return;
        }

        this.startRun();

        try {
            await this.processMissingEmbeddings(llm);
        } finally {
            this.finishRun(onComplete);
        }
    }

    private canRun(llm: LlmInterface): boolean {
        return !this.isRunning && llm.isEmbeddingReady && isAppActive();
    }

    private startRun(): void {
        this.isRunning = true;
        this.lastStartedAt = Date.now();
    }

    private finishRun(onComplete: () => void): void {
        this.isRunning = false;
        onComplete();
    }

    private async processMissingEmbeddings(llm: LlmInterface): Promise<void> {
        const merchantCallbacks = createCallbacks();
        const commentCallbacks = createCallbacks();
        const existingMerchantKeys = new Set<string>();
        const existingCommentKeys = new Set<string>();

        await processMerchantBatches(llm, existingMerchantKeys, merchantCallbacks);

        if (!isAppActive()) {
            return;
        }

        await processCommentBatches(llm, existingCommentKeys, commentCallbacks);
    }
}

export const embeddingBackfillService = new EmbeddingBackfillService();
