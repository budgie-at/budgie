import { useAtomMount, useAtomValue } from '@effect/atom-react/Hooks';

import { aiModelResidencyAtom } from '../constant/ai-model-residency-atom.constant';
import { aiModelDownloadSnapshotAtom, chatModelSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { sumAiModelDownloadBytes } from '../utils/sum-ai-model-download-bytes.util';

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
    const { models } = useAtomValue(aiModelDownloadSnapshotAtom);
    const isChatReady = chat.status === AiSubsystemStatusEnum.READY;

    useAtomMount(aiModelResidencyAtom(AiSubsystemNameEnum.CHAT));

    const { ratio } = sumAiModelDownloadBytes([models[AiSubsystemNameEnum.CHAT], models[AiSubsystemNameEnum.EMBEDDING]]);

    return {
        isChatReady,
        modelStatus: {
            isReady: isChatReady,
            isInitializing: chat.status === AiSubsystemStatusEnum.INITIALIZING || chat.status === AiSubsystemStatusEnum.DOWNLOADING,
            downloadProgress: ratio,
            error: chat.errorMessage
        }
    };
};
