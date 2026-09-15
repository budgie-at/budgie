import { useEffect } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { aiModelResidencyService } from '../service/ai-model-residency.service';

import { useAiDownloadProgress } from './use-ai-download-progress.hook';
import { useChat } from './use-chat.hook';

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
    const chat = useChat();
    const downloadProgress = useAiDownloadProgress();
    const isChatReady = chat.status === AiSubsystemStatusEnum.READY;

    useEffect(() => {
        void aiModelResidencyService.acquire(AiSubsystemNameEnum.CHAT).catch(emptyFn);

        return () => {
            aiModelResidencyService.release(AiSubsystemNameEnum.CHAT);
        };
    }, []);

    return {
        isChatReady,
        modelStatus: {
            isReady: isChatReady,
            isInitializing: chat.status === AiSubsystemStatusEnum.INITIALIZING || chat.status === AiSubsystemStatusEnum.DOWNLOADING,
            downloadProgress,
            error: chat.errorMessage
        }
    };
};
