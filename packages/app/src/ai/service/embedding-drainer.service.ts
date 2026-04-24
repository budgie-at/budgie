import { Log, LoggerNamespaceEnum, transactionAsync } from '@budgie/contracts';

import { getErrorMessage } from '@rnw-community/shared';

import { db, transactionRepository } from '../../@generic/drizzle/db/db';
import { DrainerStateEnum } from '../enum/drainer-state.enum';
import { DrainerSnapshotInterface } from '../interface/drainer-snapshot.interface';
import { aiLog } from '../utils/ai-log.util';

import { SnapshotStore } from './base-subsystem.service';
import { commentEmbeddingDrainerService } from './comment-embedding-drainer.service';
import { merchantEmbeddingDrainerService } from './merchant-embedding-drainer.service';

const deriveState = (merchantState: DrainerStateEnum, commentState: DrainerStateEnum): DrainerStateEnum => {
    if (merchantState === DrainerStateEnum.ERROR || commentState === DrainerStateEnum.ERROR) {
        return DrainerStateEnum.ERROR;
    }
    if (merchantState === DrainerStateEnum.BOOSTING || commentState === DrainerStateEnum.BOOSTING) {
        return DrainerStateEnum.BOOSTING;
    }
    if (merchantState === DrainerStateEnum.DRAINING || commentState === DrainerStateEnum.DRAINING) {
        return DrainerStateEnum.DRAINING;
    }
    if (merchantState === DrainerStateEnum.PAUSED && commentState === DrainerStateEnum.PAUSED) {
        return DrainerStateEnum.PAUSED;
    }

    return DrainerStateEnum.IDLE;
};

class EmbeddingDrainerService extends SnapshotStore<DrainerSnapshotInterface> {
    private readonly merchant = merchantEmbeddingDrainerService;
    private readonly comment = commentEmbeddingDrainerService;
    private startedSubs = false;
    private unsubscribeMerchant: (() => void) | null = null;
    private unsubscribeComment: (() => void) | null = null;
    private residueCleared = false;

    constructor() {
        super({ state: DrainerStateEnum.IDLE, pending: 0, lastDurationMs: 0, errorMessage: null });
    }

    // eslint-disable-next-line lingui/no-unlocalized-strings -- Developer log tag, not user-facing
    @Log(`[${LoggerNamespaceEnum.DRAINER}] embedding:orchestrator:start`)
    start(): void {
        if (this.startedSubs) {
            return;
        }
        this.startedSubs = true;
        this.unsubscribeMerchant = this.merchant.subscribe(this.recompute);
        this.unsubscribeComment = this.comment.subscribe(this.recompute);
        this.merchant.start();
        this.comment.start();
        void this.clearResidueOnce();
    }

    stop(): void {
        if (!this.startedSubs) {
            return;
        }
        aiLog('drainer:embedding:orchestrator:stop');
        this.merchant.stop();
        this.comment.stop();
        this.unsubscribeMerchant?.();
        this.unsubscribeComment?.();
        this.unsubscribeMerchant = null;
        this.unsubscribeComment = null;
        this.startedSubs = false;
    }

    async boost(): Promise<void> {
        aiLog('drainer:embedding:orchestrator:boost:begin');
        const started = Date.now();
        await this.merchant.boost();
        aiLog('drainer:embedding:orchestrator:merchant:complete', { durationMs: Date.now() - started });
        if (this.comment.getSnapshot().state === DrainerStateEnum.PAUSED) {
            aiLog('drainer:embedding:orchestrator:comment:skip', { reason: 'paused' });

            return;
        }
        const commentStart = Date.now();
        await this.comment.boost();
        aiLog('drainer:embedding:orchestrator:comment:complete', { durationMs: Date.now() - commentStart });
        aiLog('drainer:embedding:orchestrator:boost:done', { totalDurationMs: Date.now() - started });
    }

    cancelBoost(): void {
        this.merchant.cancelBoost();
        this.comment.cancelBoost();
    }

    async pause(): Promise<void> {
        await Promise.all([this.merchant.pause(), this.comment.pause()]);
    }

    resume(): void {
        this.merchant.resume();
        this.comment.resume();
    }

    retry(): void {
        this.merchant.retry();
        this.comment.retry();
    }

    private readonly recompute = (): void => {
        const merchantSnap = this.merchant.getSnapshot();
        const commentSnap = this.comment.getSnapshot();
        this.setSnapshot({
            state: deriveState(merchantSnap.state, commentSnap.state),
            pending: merchantSnap.pending + commentSnap.pending,
            lastDurationMs: Math.max(merchantSnap.lastDurationMs, commentSnap.lastDurationMs),
            errorMessage: merchantSnap.errorMessage ?? commentSnap.errorMessage
        });
    };

    private async clearResidueOnce(): Promise<void> {
        if (this.residueCleared) {
            return;
        }
        this.residueCleared = true;
        try {
            await transactionAsync(db, async tx => {
                await transactionRepository.clearNonIndexableFlags(tx);
                await transactionRepository.clearAlreadyIndexedMerchantFlags(tx);
                await transactionRepository.clearAlreadyIndexedCommentFlags(tx);
            });
            aiLog('orchestrator:pre-clear:done');
        } catch (error: unknown) {
            aiLog('drainer:embedding:orchestrator:residue:throw', {
                errorMessage: getErrorMessage(error)
            });
        }
    }
}

export const embeddingDrainerService = new EmbeddingDrainerService();
