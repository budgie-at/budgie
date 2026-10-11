import * as Equal from 'effect/Equal';
import * as Atom from 'effect/reactivity/Atom';

import { isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { isAiEnabled } from '../../@generic/utils/is-ai-enabled.util';
import { settingsContextAtom } from '../../settings/constants/settings-context-atom.constant';
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
const EMPTY_SNAPSHOT: AiSystemSnapshotInterface = {
    state: AiSystemStateEnum.DISABLED,
    percent: 0
};

const isBooting = (statuses: readonly AiSubsystemStatusEnum[]): boolean =>
    statuses.some(status => status === AiSubsystemStatusEnum.DOWNLOADING || status === AiSubsystemStatusEnum.INITIALIZING);

const deriveSystemStatus = (get: Atom.AtomContext): AiSystemSnapshotInterface => {
    const { settings } = get(settingsContextAtom);
    const chat = get(chatModelSnapshotAtom);
    const embedding = get(embeddingModelSnapshotAtom);
    const stt = get(sttSnapshotAtom);
    const translationDrainer = get(translationDrainerSnapshotAtom);
    const embeddingDrainer = get(embeddingDrainerSnapshotAtom);
    const isChatEnabled = settings.isAiVoiceInputEnabled || settings.isAiTranslationsEnabled;
    const isEmbeddingEnabled = settings.isAiVoiceInputEnabled || settings.isAiSuggestionsEnabled;
    const activeSubsystems = [
        ...(isChatEnabled ? [chat] : []),
        ...(isEmbeddingEnabled ? [embedding] : []),
        ...(settings.isAiVoiceInputEnabled ? [stt] : [])
    ];

    if (!isAiEnabled() || !settings.isAiEnabled || !isNotEmptyArray(activeSubsystems)) {
        return EMPTY_SNAPSHOT;
    }
    const hasSubsystemError = activeSubsystems.some(subsystem => isNotEmptyString(subsystem.errorMessage));
    const hasDrainerError = [
        ...(settings.isAiTranslationsEnabled ? [translationDrainer] : []),
        ...(settings.isAiSuggestionsEnabled ? [embeddingDrainer] : [])
    ].some(drainer => drainer.state === DrainerStateEnum.ERROR && isNotEmptyString(drainer.errorMessage));

    if (hasSubsystemError || hasDrainerError) {
        return { state: AiSystemStateEnum.ERROR, percent: 0 };
    }

    if (isBooting(activeSubsystems.map(subsystem => subsystem.status))) {
        return {
            state: AiSystemStateEnum.BOOTING,
            percent: Math.round(
                activeSubsystems.reduce((percent, subsystem) => percent + subsystem.downloadProgress, 0) / activeSubsystems.length
            )
        };
    }

    if (get(aiCoordinatorSnapshotAtom).isSuspended) {
        return { state: AiSystemStateEnum.SUSPENDED, percent: 0 };
    }

    const translationProgress = get(translationProgressSnapshotAtom);
    const embeddingProgress = get(embeddingProgressSnapshotAtom);
    const translationBoosting = settings.isAiTranslationsEnabled && translationDrainer.state === DrainerStateEnum.BOOSTING;
    const embeddingBoosting = settings.isAiSuggestionsEnabled && embeddingDrainer.state === DrainerStateEnum.BOOSTING;

    if (translationBoosting || embeddingBoosting) {
        return {
            state: AiSystemStateEnum.BOOSTING,
            percent: translationBoosting ? translationProgress.percent : embeddingProgress.percent
        };
    }

    if (settings.isAiTranslationsEnabled && isPositiveNumber(translationDrainer.pending)) {
        return { state: AiSystemStateEnum.TRANSLATING, percent: translationProgress.percent };
    }

    if (settings.isAiSuggestionsEnabled && isPositiveNumber(embeddingDrainer.pending)) {
        return { state: AiSystemStateEnum.INDEXING, percent: embeddingProgress.percent };
    }

    return { state: AiSystemStateEnum.READY, percent: FULL_PERCENT };
};

export const aiSystemStatusAtom = Atom.make(deriveSystemStatus).pipe(Atom.withEquality(Equal.equals));
