import * as Equal from 'effect/Equal';
import * as Atom from 'effect/reactivity/Atom';

import { isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { isAiEnabled } from '../../@generic/utils/is-ai-enabled.util';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiSystemStateEnum } from '../enum/ai-system-state.enum';
import { DrainerStateEnum } from '../enum/drainer-state.enum';
import { AiSystemSnapshotInterface } from '../interface/ai-system-snapshot.interface';

import {
    aiCoordinatorSnapshotAtom,
    chatModelSnapshotAtom,
    embeddingModelSnapshotAtom,
    embeddingProgressSnapshotAtom,
    sttSnapshotAtom,
    translationDrainerSnapshotAtom,
    translationProgressSnapshotAtom
} from './ai-snapshot-atoms.constant';
import { embeddingDrainerSnapshotAtom } from './embedding-drainer-snapshot-atom.constant';

const FULL_PERCENT = 100;
const SUBSYSTEM_COUNT = 3;
const EMPTY_SNAPSHOT: AiSystemSnapshotInterface = {
    state: AiSystemStateEnum.DISABLED,
    percent: 0
};

const isBooting = (statuses: readonly AiSubsystemStatusEnum[]): boolean =>
    statuses.some(status => status === AiSubsystemStatusEnum.DOWNLOADING || status === AiSubsystemStatusEnum.INITIALIZING);

// eslint-disable-next-line max-statements -- Priority-ordered derivation table across subsystem, coordinator and drainer states
const deriveSystemStatus = (get: Atom.AtomContext): AiSystemSnapshotInterface => {
    if (!isAiEnabled()) {
        return EMPTY_SNAPSHOT;
    }

    const chat = get(chatModelSnapshotAtom);
    const embedding = get(embeddingModelSnapshotAtom);
    const stt = get(sttSnapshotAtom);
    const translationDrainer = get(translationDrainerSnapshotAtom);
    const embeddingDrainer = get(embeddingDrainerSnapshotAtom);

    const hasSubsystemError = [chat, embedding, stt].some(subsystem => isNotEmptyString(subsystem.errorMessage));
    const hasDrainerError = [translationDrainer, embeddingDrainer].some(
        drainer => drainer.state === DrainerStateEnum.ERROR && isNotEmptyString(drainer.errorMessage)
    );
    if (hasSubsystemError || hasDrainerError) {
        return { state: AiSystemStateEnum.ERROR, percent: 0 };
    }

    if (isBooting([chat.status, embedding.status, stt.status])) {
        return {
            state: AiSystemStateEnum.BOOTING,
            percent: Math.round((chat.downloadProgress + embedding.downloadProgress + stt.downloadProgress) / SUBSYSTEM_COUNT)
        };
    }

    if (get(aiCoordinatorSnapshotAtom).isSuspended) {
        return { state: AiSystemStateEnum.SUSPENDED, percent: 0 };
    }

    const translationProgress = get(translationProgressSnapshotAtom);
    const embeddingProgress = get(embeddingProgressSnapshotAtom);
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

    return { state: AiSystemStateEnum.READY, percent: FULL_PERCENT };
};

export const aiSystemStatusAtom = Atom.make(deriveSystemStatus).pipe(Atom.withEquality(Equal.equals));
