/* eslint-disable max-lines -- State machine service co-locates recompute, derivation, and action dispatcher */
import { t } from '@lingui/core/macro';

import { getErrorMessage } from '@rnw-community/shared';

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
import { aiLog } from '../utils/ai-log.util';

import { aiCoordinatorService } from './ai-coordinator.service';
import { ScheduledSnapshotStore } from './base-subsystem.service';
import { chatService } from './chat.service';
import { embeddingDrainerService } from './embedding-drainer.service';
import { embeddingService } from './embedding.service';
import { sttService } from './stt.service';
import { translationDrainerService } from './translation-drainer.service';

const FULL_PERCENT = 100;
const TRUNCATE_LEN = 80;
const HALF = 2;

interface ErrorSourceInterface {
    readonly source: string;
    readonly message: string;
}

const EMPTY_SNAPSHOT: AiSystemSnapshotInterface = {
    state: AiSystemStateEnum.Disabled,
    percent: 0,
    statusText: '',
    action: AiSystemActionEnum.None,
    translationPending: 0,
    embeddingPending: 0,
    errorMessage: null
};

class AiSystemStatusService extends ScheduledSnapshotStore<AiSystemSnapshotInterface> {
    private lastState: AiSystemStateEnum = AiSystemStateEnum.Disabled;
    private lastStateAt = Date.now();

    constructor() {
        super(EMPTY_SNAPSHOT);
    }

    async boost(): Promise<void> {
        aiLog('system:action:boost');
        if (translationDrainerService.getSnapshot().pending > 0) {
            await translationDrainerService.boost();

            return;
        }
        await embeddingDrainerService.boost();
    }

    cancelBoost(): void {
        aiLog('system:action:cancel');
        translationDrainerService.cancelBoost();
        embeddingDrainerService.cancelBoost();
    }

    // eslint-disable-next-line max-statements -- Cascading retry across subsystems + drainers
    async retry(): Promise<void> {
        aiLog('system:action:retry');
        const promises: Promise<void>[] = [];
        if (chatService.getSnapshot().errorMessage !== null) {
            promises.push(chatService.retry());
        }
        if (embeddingService.getSnapshot().errorMessage !== null) {
            promises.push(embeddingService.retry());
        }
        if (sttService.getSnapshot().errorMessage !== null) {
            promises.push(sttService.retry());
        }
        await Promise.allSettled(promises);
        if (translationDrainerService.getSnapshot().state === DrainerStateEnum.Error) {
            translationDrainerService.retry();
        }
        if (embeddingDrainerService.getSnapshot().state === DrainerStateEnum.Error) {
            embeddingDrainerService.retry();
        }
    }

    // eslint-disable-next-line max-statements -- 7 rebuild steps with pause/resume bookends
    async freshRebuild(): Promise<void> {
        aiLog('system:action:rebuild:start');
        const started = Date.now();
        try {
            await Promise.all([translationDrainerService.pause(), embeddingDrainerService.pause()]);
            aiLog('system:action:rebuild:phase', { phase: 'paused' });
            try {
                await merchantEmbeddingRepository.truncate();
                await commentEmbeddingRepository.truncate();
                aiLog('system:action:rebuild:phase', { phase: 'embeddings-truncated' });
                await categoryRepository.resetAllTranslations();
                await tagRepository.resetAllTranslations();
                aiLog('system:action:rebuild:phase', { phase: 'translations-reset' });
                await transactionRepository.markAllForEmbedding();
                await transactionRepository.clearNonIndexableFlags();
                aiLog('system:action:rebuild:phase', { phase: 'transactions-marked' });
            } finally {
                translationDrainerService.resume();
                embeddingDrainerService.resume();
            }
            void translationProgressStore.refresh();
            void embeddingProgressStore.refresh();
            await translationDrainerService.boost();
            await embeddingDrainerService.boost();
            aiLog('system:action:rebuild:complete', { durationMs: Date.now() - started });
        } catch (error: unknown) {
            aiLog('system:action:rebuild:throw', { errorMessage: getErrorMessage(error) });
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
        return EMPTY_SNAPSHOT;
    }

    protected recompute(): void {
        const next = this.derive();
        if (this.snapshotEquals(next, this.snapshot)) {
            return;
        }
        if (next.state !== this.lastState) {
            const now = Date.now();
            aiLog('system:state:transition', {
                from: this.lastState,
                to: next.state,
                durationMs: now - this.lastStateAt
            });
            this.lastState = next.state;
            this.lastStateAt = now;
        }
        this.setSnapshot(next);
    }

    // eslint-disable-next-line max-statements -- Priority-ordered derivation table
    private derive(): AiSystemSnapshotInterface {
        const translationPending = translationDrainerService.getSnapshot().pending;
        const embeddingPending = embeddingDrainerService.getSnapshot().pending;

        if (!isAiEnabled()) {
            return { ...EMPTY_SNAPSHOT, statusText: t`AI disabled` };
        }

        const subsystemError = this.firstSubsystemError();
        const drainerError = this.firstDrainerError();
        if (subsystemError !== null || drainerError !== null) {
            const source = subsystemError?.source ?? drainerError?.source ?? 'unknown';
            const message = (subsystemError?.message ?? drainerError?.message ?? '').slice(0, TRUNCATE_LEN);

            return {
                state: AiSystemStateEnum.Error,
                percent: 0,
                action: AiSystemActionEnum.Retry,
                statusText: t`${source} failed: ${message}`,
                translationPending,
                embeddingPending,
                errorMessage: message
            };
        }

        const chat = chatService.getSnapshot();
        const embedding = embeddingService.getSnapshot();
        const stt = sttService.getSnapshot();
        const bootText = this.describeBoot(chat.status, embedding.status, stt.status);
        if (bootText !== null) {
            return {
                state: AiSystemStateEnum.Booting,
                percent: Math.round((chat.downloadProgress + embedding.downloadProgress) / HALF),
                action: AiSystemActionEnum.None,
                statusText: bootText,
                translationPending,
                embeddingPending,
                errorMessage: null
            };
        }

        const translationBoosting = translationDrainerService.getSnapshot().state === DrainerStateEnum.Boosting;
        const embeddingBoosting = embeddingDrainerService.getSnapshot().state === DrainerStateEnum.Boosting;
        if (translationBoosting || embeddingBoosting) {
            return this.deriveBoosting(translationBoosting, translationPending, embeddingPending);
        }

        if (translationPending > 0) {
            const { total } = translationProgressStore.getSnapshot();
            const trailer = embeddingPending > 0 ? t` • ${embeddingPending} tx queued` : '';

            return {
                state: AiSystemStateEnum.Translating,
                percent: translationProgressStore.getSnapshot().percent,
                action: AiSystemActionEnum.Boost,
                statusText: t`Translating ${translationPending} of ${total}${trailer}`,
                translationPending,
                embeddingPending,
                errorMessage: null
            };
        }

        if (embeddingPending > 0) {
            const embeddingSnap = embeddingProgressStore.getSnapshot();
            const done = embeddingSnap.total - embeddingPending;
            const { total } = embeddingSnap;

            return {
                state: AiSystemStateEnum.Indexing,
                percent: embeddingSnap.percent,
                action: AiSystemActionEnum.Boost,
                statusText: t`Indexing ${done} of ${total}`,
                translationPending,
                embeddingPending,
                errorMessage: null
            };
        }

        return {
            state: AiSystemStateEnum.Ready,
            percent: FULL_PERCENT,
            action: AiSystemActionEnum.None,
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
            state: AiSystemStateEnum.Boosting,
            percent,
            action: AiSystemActionEnum.Cancel,
            statusText: t`Fast-indexing ${done} of ${total} • tap to pause`,
            translationPending,
            embeddingPending,
            errorMessage: null
        };
    }

    private describeBoot(chat: AiSubsystemStatusEnum, embedding: AiSubsystemStatusEnum, stt: AiSubsystemStatusEnum): string | null {
        const booting = [chat, embedding, stt].some(
            status => status === AiSubsystemStatusEnum.Downloading || status === AiSubsystemStatusEnum.Initializing
        );
        if (!booting) {
            return null;
        }
        const downloading = [chat, embedding].some(status => status === AiSubsystemStatusEnum.Downloading);

        return downloading ? t`Downloading models` : t`Loading models`;
    }

    /* eslint-disable lingui/no-unlocalized-strings -- Diagnostic source labels embedded in error statusText (the message itself is native) */
    private firstSubsystemError(): ErrorSourceInterface | null {
        const chatError = chatService.getSnapshot().errorMessage;
        if (chatError !== null) {
            return { source: 'chat', message: chatError };
        }
        const embeddingError = embeddingService.getSnapshot().errorMessage;
        if (embeddingError !== null) {
            return { source: 'embedding', message: embeddingError };
        }
        const sttError = sttService.getSnapshot().errorMessage;
        if (sttError !== null) {
            return { source: 'stt', message: sttError };
        }

        return null;
    }

    private firstDrainerError(): ErrorSourceInterface | null {
        const translation = translationDrainerService.getSnapshot();
        if (translation.state === DrainerStateEnum.Error && translation.errorMessage !== null) {
            return { source: 'translation drainer', message: translation.errorMessage };
        }
        const embedding = embeddingDrainerService.getSnapshot();
        if (embedding.state === DrainerStateEnum.Error && embedding.errorMessage !== null) {
            return { source: 'embedding drainer', message: embedding.errorMessage };
        }

        return null;
    }
    /* eslint-enable lingui/no-unlocalized-strings */

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
