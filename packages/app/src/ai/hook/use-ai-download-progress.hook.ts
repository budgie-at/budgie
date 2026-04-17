import { CHAT_DOWNLOAD_WEIGHT, EMBEDDING_DOWNLOAD_WEIGHT } from '../util/ai-constants.util';

import { useChat } from './use-chat.hook';
import { useEmbedding } from './use-embedding.hook';

export const useAiDownloadProgress = (): number => {
    const chat = useChat();
    const embedding = useEmbedding();

    return chat.downloadProgress * CHAT_DOWNLOAD_WEIGHT + embedding.downloadProgress * EMBEDDING_DOWNLOAD_WEIGHT;
};
