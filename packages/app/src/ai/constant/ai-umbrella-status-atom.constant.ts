import { t } from '@lingui/core/macro';
import * as Equal from 'effect/Equal';
import * as Atom from 'effect/reactivity/Atom';

import { isDefined } from '@rnw-community/shared';

import { isAiEnabled } from '../../@generic/utils/is-ai-enabled.util';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiSystemUmbrellaStateEnum } from '../enum/ai-system-umbrella-state.enum';
import { AiSystemUmbrellaSnapshotInterface } from '../interface/ai-system-umbrella-snapshot.interface';

import { chatModelSnapshotAtom, embeddingModelSnapshotAtom, sttSnapshotAtom } from './ai-snapshot-atoms.constant';

const TRUNCATE_LEN = 80;
const SUBSYSTEM_COUNT = 3;

const getErrorSource = (chatError: string | null, embeddingError: string | null): AiSubsystemNameEnum => {
    if (isDefined(chatError)) {
        return AiSubsystemNameEnum.CHAT;
    }
    if (isDefined(embeddingError)) {
        return AiSubsystemNameEnum.EMBEDDING;
    }

    return AiSubsystemNameEnum.STT;
};

// eslint-disable-next-line max-statements -- Priority-ordered derivation table across all subsystem statuses
const deriveUmbrellaStatus = (get: Atom.AtomContext): AiSystemUmbrellaSnapshotInterface => {
    if (!isAiEnabled()) {
        return { state: AiSystemUmbrellaStateEnum.DISABLED, statusText: t`AI off`, downloadPercent: 0, errorMessage: null };
    }

    const chat = get(chatModelSnapshotAtom);
    const embedding = get(embeddingModelSnapshotAtom);
    const stt = get(sttSnapshotAtom);

    const chatError = chat.errorMessage;
    const embeddingError = embedding.errorMessage;
    const sttError = stt.errorMessage;
    if (isDefined(chatError) || isDefined(embeddingError) || isDefined(sttError)) {
        const source = getErrorSource(chatError, embeddingError);

        const message = (chatError ?? embeddingError ?? sttError ?? '').slice(0, TRUNCATE_LEN);

        return {
            state: AiSystemUmbrellaStateEnum.MODEL_ERROR,
            statusText: t`${source} error · ${message}`,
            downloadPercent: 0,
            errorMessage: message
        };
    }

    const statuses = [chat.status, embedding.status, stt.status] as const;

    if (statuses.some(status => status === AiSubsystemStatusEnum.DOWNLOADING)) {
        const downloadPercent = Math.round((chat.downloadProgress + embedding.downloadProgress + stt.downloadProgress) / SUBSYSTEM_COUNT);

        return {
            state: AiSystemUmbrellaStateEnum.DOWNLOADING,
            statusText: t`Downloading AI models…`,
            downloadPercent,
            errorMessage: null
        };
    }

    if (statuses.some(status => status === AiSubsystemStatusEnum.INITIALIZING)) {
        return {
            state: AiSystemUmbrellaStateEnum.INITIALIZING,
            statusText: t`Starting up AI…`,
            downloadPercent: 0,
            errorMessage: null
        };
    }

    if (statuses.every(status => status === AiSubsystemStatusEnum.DISABLED)) {
        return { state: AiSystemUmbrellaStateEnum.DISABLED, statusText: t`AI off`, downloadPercent: 0, errorMessage: null };
    }

    return { state: AiSystemUmbrellaStateEnum.HEALTHY, statusText: '', downloadPercent: 0, errorMessage: null };
};

export const aiUmbrellaStatusAtom = Atom.make(deriveUmbrellaStatus).pipe(Atom.withEquality(Equal.equals));
