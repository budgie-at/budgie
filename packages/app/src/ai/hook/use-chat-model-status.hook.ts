import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import { useEffect } from 'react';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { chatModelSnapshotAtom, embeddingModelSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiModelResidencyService } from '../service/ai-model-residency.service';
import { CHAT_DOWNLOAD_WEIGHT, EMBEDDING_DOWNLOAD_WEIGHT } from '../util/ai-constants.util';

interface ChatModelStatusInterface {
    readonly isReady: boolean;
    readonly isInitializing: boolean;
    readonly downloadProgress: number;
    readonly error: string | null;
}

interface UseChatModelStatusReturn {
    readonly isChatReady: boolean;
    readonly modelStatus: ChatModelStatusInterface;
}

export const useChatModelStatus = (): UseChatModelStatusReturn => {
    const chat = useAtomValue(chatModelSnapshotAtom);
    const embedding = useAtomValue(embeddingModelSnapshotAtom);
    const isChatReady = chat.status === AiSubsystemStatusEnum.READY;

    useEffect(() => {
        appRuntime.runFork(
            Effect.flatMap(AiModelResidencyService, aiModelResidencyService => aiModelResidencyService.acquire(AiSubsystemNameEnum.CHAT))
        );

        return () => {
            appRuntime.runFork(
                Effect.flatMap(AiModelResidencyService, aiModelResidencyService =>
                    aiModelResidencyService.release(AiSubsystemNameEnum.CHAT)
                )
            );
        };
    }, []);

    return {
        isChatReady,
        modelStatus: {
            isReady: isChatReady,
            isInitializing: chat.status === AiSubsystemStatusEnum.INITIALIZING || chat.status === AiSubsystemStatusEnum.DOWNLOADING,
            downloadProgress: chat.downloadProgress * CHAT_DOWNLOAD_WEIGHT + embedding.downloadProgress * EMBEDDING_DOWNLOAD_WEIGHT,
            error: chat.errorMessage
        }
    };
};
