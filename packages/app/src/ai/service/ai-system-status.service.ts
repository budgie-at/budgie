/* eslint-disable max-lines -- State machine service co-locates recompute, derivation, and action dispatcher */
import { Log, getLogger } from '@budgie/logger';
import { t } from '@lingui/core/macro';

import { getErrorMessage, isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import {
    categoryRepository,
    commentEmbeddingRepository,
    merchantEmbeddingRepository,
    tagRepository,
    transactionRepository
} from '../../@generic/drizzle/db/db';
import { isAiEnabled } from '../../@generic/utils/is-ai-enabled.util';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiSystemActionEnum } from '../enum/ai-system-action.enum';
import { AiSystemStateEnum } from '../enum/ai-system-state.enum';
import { DrainerStateEnum } from '../enum/drainer-state.enum';
import { AiSystemSnapshotInterface } from '../interface/ai-system-snapshot.interface';
import { embeddingProgressStore } from '../store/embedding-progress.store';
import { translationProgressStore } from '../store/translation-progress.store';

import { aiCoordinatorService } from './ai-coordinator.service';
import { ScheduledSnapshotStore } from './base-subsystem.service';
import { chatService } from './chat.service';
import { embeddingDrainerService } from './embedding-drainer.service';
import { embeddingService } from './embedding.service';
import { sttService } from './stt.service';
import { translationDrainerService } from './translation-drainer.service';
const logger = getLogger('AiSystemStatusService');

const FULL_PERCENT = 100;
const TRUNCATE_LEN = 80;
const HALF = 2;

interface ErrorSourceInterface {
    readonly source: string;
    readonly message: string;
}

type SuspendedOrIdleState = AiSystemStateEnum.SUSPENDED | AiSystemStateEnum.IDLE;

const EMPTY_SNAPSHOT: AiSystemSnapshotInterface = {
    state: AiSystemStateEnum.DISABLED,
    percent: 0,
    statusText: '',
    action: AiSystemActionEnum.NONE,
    translationPending: 0,
    embeddingPending: 0,
    errorMessage: null
};

class AiSystemStatusService extends ScheduledSnapshotStore<AiSystemSnapshotInterface> {
    private lastState: AiSystemStateEnum = AiSystemStateEnum.DISABLED;
    private lastStateAt = Date.now();

    constructor() {
        super(EMPTY_SNAPSHOT);
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async boost(): Promise<void> {
        if (isPositiveNumber(translationDrainerService.getSnapshot().pending)) {
            await translationDrainerService.boost();

            return;
        }
        await embeddingDrainerService.boost();
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    cancelBoost(): void {
        translationDrainerService.cancelBoost();
        embeddingDrainerService.cancelBoost();
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async retry(): Promise<void> {
        const promises: Promise<void>[] = [];
        if (isNotEmptyString(chatService.getSnapshot().errorMessage)) {
            promises.push(chatService.retry());
        }
        if (isNotEmptyString(embeddingService.getSnapshot().errorMessage)) {
            promises.push(embeddingService.retry());
        }
        if (isNotEmptyString(sttService.getSnapshot().errorMessage)) {
            promises.push(sttService.retry());
        }
        await Promise.allSettled(promises);
        if (translationDrainerService.getSnapshot().state === DrainerStateEnum.ERROR) {
            translationDrainerService.retry();
        }
        if (embeddingDrainerService.getSnapshot().state === DrainerStateEnum.ERROR) {
            embeddingDrainerService.retry();
        }
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    // eslint-disable-next-line max-statements -- 7 rebuild steps with pause/resume bookends
    async freshRebuild(): Promise<void> {
        try {
            await this.pauseDrainers();
            try {
                await this.truncateEmbeddings();
                await this.resetTranslations();
                await this.markTransactionsForRebuild();
            } finally {
                translationDrainerService.resume();
                embeddingDrainerService.resume();
            }
            void translationProgressStore.refresh();
            void embeddingProgressStore.refresh();
            await translationDrainerService.boost();
            await embeddingDrainerService.boost();
        } catch (error: unknown) {
            translationDrainerService.resume();
            embeddingDrainerService.resume();
            throw error;
        }
    }

    protected buildSubscriptions(): (() => void)[] {
        return [
            chatService.subscribe(this.scheduleRecompute),
            embeddingService.subscribe(this.scheduleRecompute),
            sttService.subscribe(this.scheduleRecompute),
            aiCoordinatorService.subscribe(this.scheduleRecompute),
            translationDrainerService.subscribe(this.scheduleRecompute),
            embeddingDrainerService.subscribe(this.scheduleRecompute),
            embeddingProgressStore.subscribe(this.scheduleRecompute),
            translationProgressStore.subscribe(this.scheduleRecompute)
        ];
    }

    protected emptySnapshot(): AiSystemSnapshotInterface {
        return { ...EMPTY_SNAPSHOT };
    }

    protected recompute(): void {
        const next = this.derive();
        if (this.snapshotEquals(next, this.snapshot)) {
            return;
        }
        if (next.state !== this.lastState) {
            const now = Date.now();
            logger.log('system:state:transition', {
                from: this.lastState,
                to: next.state,
                durationMs: now - this.lastStateAt
            });
            this.lastState = next.state;
            this.lastStateAt = now;
        }
        this.setSnapshot(next);
    }

    private async pauseDrainers(): Promise<void> {
        await Promise.all([translationDrainerService.pause(), embeddingDrainerService.pause()]);
    }

    private async truncateEmbeddings(): Promise<void> {
        await merchantEmbeddingRepository.truncate();
        await commentEmbeddingRepository.truncate();
    }

    private async resetTranslations(): Promise<void> {
        await categoryRepository.resetAllTranslations();
        await tagRepository.resetAllTranslations();
    }

    private async markTransactionsForRebuild(): Promise<void> {
        await transactionRepository.markAllForEmbedding();
        await transactionRepository.clearNonIndexableFlags();
    }

    // eslint-disable-next-line max-statements, max-lines-per-function -- Priority-ordered derivation table with exhaustive SUSPENDED/IDLE branches
    private derive(): AiSystemSnapshotInterface {
        const translationPending = translationDrainerService.getSnapshot().pending;
        const embeddingPending = embeddingDrainerService.getSnapshot().pending;

        if (!isAiEnabled()) {
            return { ...EMPTY_SNAPSHOT, statusText: t`AI disabled` };
        }

        const subsystemError = this.firstSubsystemError();
        const drainerError = this.firstDrainerError();
        if (isDefined(subsystemError) || isDefined(drainerError)) {
            const source = subsystemError?.source ?? drainerError?.source ?? 'unknown';
            const message = (subsystemError?.message ?? drainerError?.message ?? '').slice(0, TRUNCATE_LEN);

            return {
                state: AiSystemStateEnum.ERROR,
                percent: 0,
                action: AiSystemActionEnum.RETRY,
                statusText: t`${source} failed: ${message}`,
                translationPending,
                embeddingPending,
                errorMessage: message
            };
        }

        const chat = chatService.getSnapshot();
        const embedding = embeddingService.getSnapshot();
        const bootText = this.describeBoot(chat.status, embedding.status);
        if (isNotEmptyString(bootText)) {
            return {
                state: AiSystemStateEnum.BOOTING,
                percent: Math.round((chat.downloadProgress + embedding.downloadProgress) / HALF),
                action: AiSystemActionEnum.NONE,
                statusText: bootText,
                translationPending,
                embeddingPending,
                errorMessage: null
            };
        }

        const suspendedOrIdle = this.firstSuspendedOrIdle(chat.status, embedding.status);
        if (isDefined(suspendedOrIdle)) {
            const statusText = suspendedOrIdle === AiSystemStateEnum.SUSPENDED ? t`Resuming AI…` : t`AI idle`;

            return {
                state: suspendedOrIdle,
                percent: 0,
                action: AiSystemActionEnum.NONE,
                statusText,
                translationPending,
                embeddingPending,
                errorMessage: null
            };
        }

        const translationBoosting = translationDrainerService.getSnapshot().state === DrainerStateEnum.BOOSTING;
        const embeddingBoosting = embeddingDrainerService.getSnapshot().state === DrainerStateEnum.BOOSTING;
        if (translationBoosting || embeddingBoosting) {
            return this.deriveBoosting(translationBoosting, translationPending, embeddingPending);
        }

        if (isPositiveNumber(translationPending)) {
            const { total } = translationProgressStore.getSnapshot();
            const trailer = isPositiveNumber(embeddingPending) ? t` • ${embeddingPending} tx queued` : '';

            return {
                state: AiSystemStateEnum.TRANSLATING,
                percent: translationProgressStore.getSnapshot().percent,
                action: AiSystemActionEnum.BOOST,
                statusText: t`Translating ${translationPending} of ${total}${trailer}`,
                translationPending,
                embeddingPending,
                errorMessage: null
            };
        }

        if (isPositiveNumber(embeddingPending)) {
            const embeddingSnap = embeddingProgressStore.getSnapshot();
            const done = embeddingSnap.total - embeddingPending;
            const { total } = embeddingSnap;

            return {
                state: AiSystemStateEnum.INDEXING,
                percent: embeddingSnap.percent,
                action: AiSystemActionEnum.BOOST,
                statusText: t`Indexing ${done} of ${total}`,
                translationPending,
                embeddingPending,
                errorMessage: null
            };
        }

        return {
            state: AiSystemStateEnum.READY,
            percent: FULL_PERCENT,
            action: AiSystemActionEnum.NONE,
            statusText: t`All set`,
            translationPending,
            embeddingPending,
            errorMessage: null
        };
    }

    private deriveBoosting(translationBoosting: boolean, translationPending: number, embeddingPending: number): AiSystemSnapshotInterface {
        const translationSnap = translationProgressStore.getSnapshot();
        const embeddingSnap = embeddingProgressStore.getSnapshot();
        const percent = translationBoosting ? translationSnap.percent : embeddingSnap.percent;
        const total = translationBoosting ? translationSnap.total : embeddingSnap.total;
        const done = translationBoosting ? total - translationPending : total - embeddingPending;

        return {
            state: AiSystemStateEnum.BOOSTING,
            percent,
            action: AiSystemActionEnum.CANCEL,
            statusText: t`Fast-indexing ${done} of ${total} • tap to pause`,
            translationPending,
            embeddingPending,
            errorMessage: null
        };
    }

    private describeBoot(chat: AiSubsystemStatusEnum, embedding: AiSubsystemStatusEnum): string | null {
        const statuses = [chat, embedding] as const;
        const booting = statuses.some(
            status => status === AiSubsystemStatusEnum.DOWNLOADING || status === AiSubsystemStatusEnum.INITIALIZING
        );
        if (!booting) {
            return null;
        }
        const downloading = statuses.some(status => status === AiSubsystemStatusEnum.DOWNLOADING);

        return downloading ? t`Downloading models` : t`Loading models`;
    }

    private firstSuspendedOrIdle(chat: AiSubsystemStatusEnum, embedding: AiSubsystemStatusEnum): SuspendedOrIdleState | null {
        const statuses = [chat, embedding] as const;
        if (statuses.some(status => status === AiSubsystemStatusEnum.SUSPENDED)) {
            return AiSystemStateEnum.SUSPENDED;
        }
        if (statuses.some(status => status === AiSubsystemStatusEnum.IDLE)) {
            return AiSystemStateEnum.IDLE;
        }

        return null;
    }

    /* eslint-disable lingui/no-unlocalized-strings -- Diagnostic source labels embedded in error statusText (the message itself is native) */
    private firstSubsystemError(): ErrorSourceInterface | null {
        const chatError = chatService.getSnapshot().errorMessage;
        if (isNotEmptyString(chatError)) {
            return { source: 'chat', message: chatError };
        }
        const embeddingError = embeddingService.getSnapshot().errorMessage;
        if (isNotEmptyString(embeddingError)) {
            return { source: 'embedding', message: embeddingError };
        }
        const sttError = sttService.getSnapshot().errorMessage;
        if (isNotEmptyString(sttError)) {
            return { source: 'stt', message: sttError };
        }

        return null;
    }

    private firstDrainerError(): ErrorSourceInterface | null {
        const translation = translationDrainerService.getSnapshot();
        if (translation.state === DrainerStateEnum.ERROR && isNotEmptyString(translation.errorMessage)) {
            return { source: 'translation drainer', message: translation.errorMessage };
        }
        const embedding = embeddingDrainerService.getSnapshot();
        if (embedding.state === DrainerStateEnum.ERROR && isNotEmptyString(embedding.errorMessage)) {
            return { source: 'embedding drainer', message: embedding.errorMessage };
        }

        return null;
    }

    private snapshotEquals(current: AiSystemSnapshotInterface, next: AiSystemSnapshotInterface): boolean {
        return (
            current.state === next.state &&
            current.percent === next.percent &&
            current.action === next.action &&
            current.statusText === next.statusText &&
            current.translationPending === next.translationPending &&
            current.embeddingPending === next.embeddingPending &&
            current.errorMessage === next.errorMessage
        );
    }
}

export const aiSystemStatusService = new AiSystemStatusService();
