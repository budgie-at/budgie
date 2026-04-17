import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';

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
    const isChatReady = chat.status === AiSubsystemStatusEnum.Ready;

    return {
        isChatReady,
        modelStatus: {
            isReady: isChatReady,
            isInitializing: chat.status === AiSubsystemStatusEnum.Initializing || chat.status === AiSubsystemStatusEnum.Downloading,
            downloadProgress,
            error: chat.errorMessage
        }
    };
};
