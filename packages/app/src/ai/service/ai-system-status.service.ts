import * as Equal from 'effect/Equal';
import * as Atom from 'effect/reactivity/Atom';

import { isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { isAiEnabled } from '../../@generic/utils/is-ai-enabled.util';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiSystemStateEnum } from '../enum/ai-system-state.enum';
import { DrainerStateEnum } from '../enum/drainer-state.enum';
import { AiSystemSnapshotInterface } from '../interface/ai-system-snapshot.interface';
import { embeddingProgressStore } from '../store/embedding-progress.store';
import { translationProgressStore } from '../store/translation-progress.store';

import { aiCoordinatorService } from './ai-coordinator.service';
import { chatService } from './chat.service';
import { embeddingDrainerService } from './embedding-drainer.service';
import { embeddingService } from './embedding.service';
import { sttService } from './stt.service';
import { translationDrainerService } from './translation-drainer.service';

class AiSystemStatusService {
    private static readonly FULL_PERCENT = 100;
    private static readonly SUBSYSTEM_COUNT = 3;
    private static readonly EMPTY_SNAPSHOT: AiSystemSnapshotInterface = {
        state: AiSystemStateEnum.DISABLED,
        percent: 0
    };

    readonly snapshot = Atom.make(get => this.derive(get)).pipe(Atom.withEquality(Equal.equals));

    // eslint-disable-next-line max-statements -- Priority-ordered derivation table across subsystem, coordinator and drainer states
    private derive(get: Atom.AtomContext): AiSystemSnapshotInterface {
        if (!isAiEnabled()) {
            return AiSystemStatusService.EMPTY_SNAPSHOT;
        }

        const chat = get(chatService.model.snapshot);
        const embedding = get(embeddingService.model.snapshot);
        const stt = get(sttService.snapshot);
        const translationDrainer = get(translationDrainerService.snapshot);
        const embeddingDrainer = get(embeddingDrainerService.snapshot);

        const hasSubsystemError = [chat, embedding, stt].some(subsystem => isNotEmptyString(subsystem.errorMessage));
        const hasDrainerError = [translationDrainer, embeddingDrainer].some(
            drainer => drainer.state === DrainerStateEnum.ERROR && isNotEmptyString(drainer.errorMessage)
        );
        if (hasSubsystemError || hasDrainerError) {
            return { state: AiSystemStateEnum.ERROR, percent: 0 };
        }

        if (this.isBooting([chat.status, embedding.status, stt.status])) {
            return {
                state: AiSystemStateEnum.BOOTING,
                percent: Math.round(
                    (chat.downloadProgress + embedding.downloadProgress + stt.downloadProgress) / AiSystemStatusService.SUBSYSTEM_COUNT
                )
            };
        }

        if (get(aiCoordinatorService.snapshot).isSuspended) {
            return { state: AiSystemStateEnum.SUSPENDED, percent: 0 };
        }

        const translationProgress = get(translationProgressStore.snapshot);
        const embeddingProgress = get(embeddingProgressStore.snapshot);
        const translationBoosting = translationDrainer.state === DrainerStateEnum.BOOSTING;
        if (translationBoosting || embeddingDrainer.state === DrainerStateEnum.BOOSTING) {
            return {
                state: AiSystemStateEnum.BOOSTING,
                percent: translationBoosting ? translationProgress.percent : embeddingProgress.percent
            };
        }

        if (isPositiveNumber(translationDrainer.pending)) {
            return { state: AiSystemStateEnum.TRANSLATING, percent: translationProgress.percent };
        }

        if (isPositiveNumber(embeddingDrainer.pending)) {
            return { state: AiSystemStateEnum.INDEXING, percent: embeddingProgress.percent };
        }

        return { state: AiSystemStateEnum.READY, percent: AiSystemStatusService.FULL_PERCENT };
    }

    private isBooting(statuses: readonly AiSubsystemStatusEnum[]): boolean {
        return statuses.some(status => status === AiSubsystemStatusEnum.DOWNLOADING || status === AiSubsystemStatusEnum.INITIALIZING);
    }
}

export const aiSystemStatusService = new AiSystemStatusService();
