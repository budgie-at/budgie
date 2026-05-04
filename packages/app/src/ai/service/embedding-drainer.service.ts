import { transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { emptyFn, getErrorMessage } from '@rnw-community/shared';

import { db, transactionRepository } from '../../@generic/drizzle/db/db';
import { DrainerStateEnum } from '../enum/drainer-state.enum';
import { DrainerSnapshotInterface } from '../interface/drainer-snapshot.interface';

import { SnapshotStore } from './base-subsystem.service';
import { commentEmbeddingDrainerService } from './comment-embedding-drainer.service';
import { merchantEmbeddingDrainerService } from './merchant-embedding-drainer.service';

class EmbeddingDrainerService extends SnapshotStore<DrainerSnapshotInterface> {
    private static readonly EMPTY_SNAPSHOT: DrainerSnapshotInterface = {
        state: DrainerStateEnum.IDLE,
        pending: 0,
        lastDurationMs: 0,
        errorMessage: null
    };

    private readonly merchant = merchantEmbeddingDrainerService;
    private readonly comment = commentEmbeddingDrainerService;
    private startedSubs = false;
    private unsubscribeMerchant: (() => void) | null = null;
    private unsubscribeComment: (() => void) | null = null;
    private residueCleared = false;

    constructor() {
        super(EmbeddingDrainerService.EMPTY_SNAPSHOT);
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    start(): void {
        if (this.startedSubs) {
            return;
        }
        this.startedSubs = true;
        this.unsubscribeMerchant = this.merchant.subscribe(() => {
            this.recompute();
        });
        this.unsubscribeComment = this.comment.subscribe(() => {
            this.recompute();
        });
        this.merchant.start();
        this.comment.start();
        void this.clearResidueOnce().catch(emptyFn);
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    stop(): void {
        if (!this.startedSubs) {
            return;
        }
        this.merchant.stop();
        this.comment.stop();
        this.unsubscribeMerchant?.();
        this.unsubscribeComment?.();
        this.unsubscribeMerchant = null;
        this.unsubscribeComment = null;
        this.startedSubs = false;
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async boost(): Promise<void> {
        await this.boostMerchant();
        if (this.comment.getSnapshot().state === DrainerStateEnum.PAUSED) {
            return;
        }
        await this.boostComment();
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    cancelBoost(): void {
        this.merchant.cancelBoost();
        this.comment.cancelBoost();
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async pause(): Promise<void> {
        await Promise.all([this.merchant.pause(), this.comment.pause()]);
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    resume(): void {
        this.merchant.resume();
        this.comment.resume();
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    retry(): void {
        this.merchant.retry();
        this.comment.retry();
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    private async boostMerchant(): Promise<void> {
        await this.merchant.boost();
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    private async boostComment(): Promise<void> {
        await this.comment.boost();
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    private async clearResidueOnce(): Promise<void> {
        if (this.residueCleared) {
            return;
        }
        this.residueCleared = true;
        await transactionAsync(db, async tx => {
            await transactionRepository.clearNonIndexableFlags(tx);
            await transactionRepository.clearAlreadyIndexedMerchantFlags(tx);
            await transactionRepository.clearAlreadyIndexedCommentFlags(tx);
        });
    }

    private recompute(): void {
        const merchantSnap = this.merchant.getSnapshot();
        const commentSnap = this.comment.getSnapshot();
        this.setSnapshot({
            state: EmbeddingDrainerService.deriveState(merchantSnap.state, commentSnap.state),
            pending: merchantSnap.pending + commentSnap.pending,
            lastDurationMs: Math.max(merchantSnap.lastDurationMs, commentSnap.lastDurationMs),
            errorMessage: merchantSnap.errorMessage ?? commentSnap.errorMessage
        });
    }

    private static deriveState(merchantState: DrainerStateEnum, commentState: DrainerStateEnum): DrainerStateEnum {
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
    }
}

export const embeddingDrainerService = new EmbeddingDrainerService();
