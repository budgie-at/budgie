import { t } from '@lingui/core/macro';
import * as Effect from 'effect/Effect';
import * as Equal from 'effect/Equal';
import * as Atom from 'effect/reactivity/Atom';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import {
    categoryRepository,
    commentEmbeddingRepository,
    merchantEmbeddingRepository,
    tagRepository,
    transactionRepository
} from '../../@generic/drizzle/db/db';
import { isAiEnabled } from '../../@generic/utils/is-ai-enabled.util';
import { aiAtomRegistry } from '../constant/ai-atom-registry.constant';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiSystemActionEnum } from '../enum/ai-system-action.enum';
import { AiSystemStateEnum } from '../enum/ai-system-state.enum';
import { DrainerStateEnum } from '../enum/drainer-state.enum';
import { AiErrorSourceInterface } from '../interface/ai-error-source.interface';
import { AiSystemSnapshotInterface } from '../interface/ai-system-snapshot.interface';
import { DrainerSnapshotInterface } from '../interface/drainer-snapshot.interface';
import { SnapshotWithStatusInterface } from '../interface/snapshot-with-status.interface';
import { embeddingProgressStore } from '../store/embedding-progress.store';
import { translationProgressStore } from '../store/translation-progress.store';

import { aiCoordinatorService } from './ai-coordinator.service';
import { aiModelResidencyService } from './ai-model-residency.service';
import { chatService } from './chat.service';
import { embeddingDrainerService } from './embedding-drainer.service';
import { embeddingService } from './embedding.service';
import { sttService } from './stt.service';
import { translationDrainerService } from './translation-drainer.service';

import type { Db } from '@budgie/contracts';

class AiSystemStatusService {
    private static readonly FULL_PERCENT = 100;
    private static readonly TRUNCATE_LEN = 80;
    private static readonly SUBSYSTEM_COUNT = 3;
    private static readonly SUBSYSTEM_SNAPSHOTS: Record<AiSubsystemNameEnum, Atom.Atom<SnapshotWithStatusInterface>> = {
        [AiSubsystemNameEnum.CHAT]: chatService.model.snapshot,
        [AiSubsystemNameEnum.EMBEDDING]: embeddingService.model.snapshot,
        [AiSubsystemNameEnum.STT]: sttService.snapshot
    };

    private static readonly EMPTY_SNAPSHOT: AiSystemSnapshotInterface = {
        state: AiSystemStateEnum.DISABLED,
        percent: 0,
        statusText: '',
        action: AiSystemActionEnum.NONE,
        translationPending: 0,
        embeddingPending: 0,
        errorMessage: null
    };

    readonly snapshot = Atom.make(get => this.derive(get)).pipe(Atom.withEquality(Equal.equals));

    readonly boost = Effect.fn('AiSystemStatusService.boost')(function* () {
        if (isPositiveNumber(aiAtomRegistry.get(translationDrainerService.snapshot).pending)) {
            yield* translationDrainerService.boost();

            return;
        }
        yield* embeddingDrainerService.boost();
    });

    readonly retry = Effect.fn('AiSystemStatusService.retry')(function* () {
        yield* Effect.forEach(
            Object.values(AiSubsystemNameEnum).filter(subsystem =>
                isNotEmptyString(aiAtomRegistry.get(AiSystemStatusService.SUBSYSTEM_SNAPSHOTS[subsystem]).errorMessage)
            ),
            subsystem => aiModelResidencyService.retry(subsystem),
            { concurrency: 'unbounded', discard: true }
        );
        if (aiAtomRegistry.get(translationDrainerService.snapshot).state === DrainerStateEnum.ERROR) {
            yield* translationDrainerService.retry();
        }
        if (aiAtomRegistry.get(embeddingDrainerService.snapshot).state === DrainerStateEnum.ERROR) {
            yield* embeddingDrainerService.retry();
        }
    });

    readonly freshRebuild = Effect.fn('AiSystemStatusService.freshRebuild')(
        function* (this: AiSystemStatusService) {
            yield* Effect.all([translationDrainerService.pause(), embeddingDrainerService.pause()], { concurrency: 'unbounded' });
            yield* Effect.ensuring(
                Effect.all([
                    merchantEmbeddingRepository.truncate(),
                    commentEmbeddingRepository.truncate(),
                    categoryRepository.resetAllTranslations(),
                    tagRepository.resetAllTranslations(),
                    transactionRepository.markAllForEmbedding(),
                    transactionRepository.clearNonIndexableFlags()
                ]),
                this.resumeDrainers()
            );
            yield* translationProgressStore.refresh();
            yield* embeddingProgressStore.refresh();
            yield* translationDrainerService.boost();
            yield* embeddingDrainerService.boost();
        },
        effect => Effect.onError(effect, () => this.resumeDrainers())
    );

    cancelBoost(): void {
        translationDrainerService.cancelBoost();
        embeddingDrainerService.cancelBoost();
    }

    private resumeDrainers(): Effect.Effect<void, never, Db> {
        return Effect.andThen(translationDrainerService.resume(), embeddingDrainerService.resume());
    }

    // eslint-disable-next-line max-statements, max-lines-per-function -- Priority-ordered derivation table across subsystem, coordinator and drainer states
    private derive(get: Atom.AtomContext): AiSystemSnapshotInterface {
        const translation = get(translationDrainerService.snapshot);
        const embeddingDrainer = get(embeddingDrainerService.snapshot);
        const translationPending = translation.pending;
        const embeddingPending = embeddingDrainer.pending;

        if (!isAiEnabled()) {
            return { ...AiSystemStatusService.EMPTY_SNAPSHOT, statusText: t`AI disabled` };
        }

        const chat = get(chatService.model.snapshot);
        const embedding = get(embeddingService.model.snapshot);
        const stt = get(sttService.snapshot);
        const error = this.firstSubsystemError(chat, embedding, stt) ?? this.firstDrainerError(translation, embeddingDrainer);
        if (isDefined(error)) {
            const { source } = error;
            const message = error.message.slice(0, AiSystemStatusService.TRUNCATE_LEN);

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

        const bootText = this.describeBoot(chat.status, embedding.status, stt.status);
        if (isNotEmptyString(bootText)) {
            return {
                state: AiSystemStateEnum.BOOTING,
                percent: Math.round(
                    (chat.downloadProgress + embedding.downloadProgress + stt.downloadProgress) / AiSystemStatusService.SUBSYSTEM_COUNT
                ),
                action: AiSystemActionEnum.NONE,
                statusText: bootText,
                translationPending,
                embeddingPending,
                errorMessage: null
            };
        }

        if (get(aiCoordinatorService.snapshot).isSuspended) {
            return {
                state: AiSystemStateEnum.SUSPENDED,
                percent: 0,
                action: AiSystemActionEnum.NONE,
                statusText: t`Resuming AI…`,
                translationPending,
                embeddingPending,
                errorMessage: null
            };
        }

        const translationProgress = get(translationProgressStore.snapshot);
        const embeddingProgress = get(embeddingProgressStore.snapshot);
        const translationBoosting = translation.state === DrainerStateEnum.BOOSTING;
        if (translationBoosting || embeddingDrainer.state === DrainerStateEnum.BOOSTING) {
            const boostingProgress = translationBoosting ? translationProgress : embeddingProgress;
            const { total } = boostingProgress;
            const done = total - (translationBoosting ? translationPending : embeddingPending);

            return {
                state: AiSystemStateEnum.BOOSTING,
                percent: boostingProgress.percent,
                action: AiSystemActionEnum.CANCEL,
                statusText: t`Fast-indexing ${done} of ${total} • tap to pause`,
                translationPending,
                embeddingPending,
                errorMessage: null
            };
        }

        if (isPositiveNumber(translationPending)) {
            const { total } = translationProgress;
            const trailer = isPositiveNumber(embeddingPending) ? t` • ${embeddingPending} tx queued` : '';

            return {
                state: AiSystemStateEnum.TRANSLATING,
                percent: translationProgress.percent,
                action: AiSystemActionEnum.BOOST,
                statusText: t`Translating ${translationPending} of ${total}${trailer}`,
                translationPending,
                embeddingPending,
                errorMessage: null
            };
        }

        if (isPositiveNumber(embeddingPending)) {
            const done = embeddingProgress.total - embeddingPending;
            const { total } = embeddingProgress;

            return {
                state: AiSystemStateEnum.INDEXING,
                percent: embeddingProgress.percent,
                action: AiSystemActionEnum.BOOST,
                statusText: t`Indexing ${done} of ${total}`,
                translationPending,
                embeddingPending,
                errorMessage: null
            };
        }

        return {
            state: AiSystemStateEnum.READY,
            percent: AiSystemStatusService.FULL_PERCENT,
            action: AiSystemActionEnum.NONE,
            statusText: t`All set`,
            translationPending,
            embeddingPending,
            errorMessage: null
        };
    }

    private describeBoot(chat: AiSubsystemStatusEnum, embedding: AiSubsystemStatusEnum, stt: AiSubsystemStatusEnum): string | null {
        const statuses = [chat, embedding, stt] as const;
        const booting = statuses.some(
            status => status === AiSubsystemStatusEnum.DOWNLOADING || status === AiSubsystemStatusEnum.INITIALIZING
        );
        if (!booting) {
            return null;
        }
        const downloading = statuses.some(status => status === AiSubsystemStatusEnum.DOWNLOADING);

        return downloading ? t`Downloading models` : t`Loading models`;
    }

    /* oxlint-disable lingui/no-unlocalized-strings -- Diagnostic source labels embedded in error statusText (the message itself is native) */
    private firstSubsystemError(
        chat: SnapshotWithStatusInterface,
        embedding: SnapshotWithStatusInterface,
        stt: SnapshotWithStatusInterface
    ): AiErrorSourceInterface | null {
        if (isNotEmptyString(chat.errorMessage)) {
            return { source: 'chat', message: chat.errorMessage };
        }
        if (isNotEmptyString(embedding.errorMessage)) {
            return { source: 'embedding', message: embedding.errorMessage };
        }
        if (isNotEmptyString(stt.errorMessage)) {
            return { source: 'stt', message: stt.errorMessage };
        }

        return null;
    }

    private firstDrainerError(translation: DrainerSnapshotInterface, embedding: DrainerSnapshotInterface): AiErrorSourceInterface | null {
        if (translation.state === DrainerStateEnum.ERROR && isNotEmptyString(translation.errorMessage)) {
            return { source: 'translation drainer', message: translation.errorMessage };
        }
        if (embedding.state === DrainerStateEnum.ERROR && isNotEmptyString(embedding.errorMessage)) {
            return { source: 'embedding drainer', message: embedding.errorMessage };
        }

        return null;
    }
}

export const aiSystemStatusService = new AiSystemStatusService();
