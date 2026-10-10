import { EMBEDDING_MODEL_FILENAME } from '@budgie/categorization';

import { AiModelStorageIdEnum } from '../enum/ai-model-storage-id.enum';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { CHAT_MODEL_FILENAME } from '../util/ai-constants.util';

import { WHISPER_MODEL_DIRECTORY, WHISPER_MODEL_FILENAME, WHISPER_MODEL_TEMP_FILENAME } from './whisper-model.constant';

import type { AiModelStorageFileInterface } from '../interface/ai-model-storage-file.interface';

export const AI_MODEL_STORAGE_FILES: readonly AiModelStorageFileInterface[] = [
    {
        id: AiModelStorageIdEnum.CHAT,
        path: [CHAT_MODEL_FILENAME],
        isCurrent: true,
        subsystem: AiSubsystemNameEnum.CHAT
    },
    {
        id: AiModelStorageIdEnum.EMBEDDING,
        path: [EMBEDDING_MODEL_FILENAME],
        isCurrent: true,
        subsystem: AiSubsystemNameEnum.EMBEDDING
    },
    {
        id: AiModelStorageIdEnum.STT,
        path: [WHISPER_MODEL_DIRECTORY, WHISPER_MODEL_FILENAME],
        isCurrent: true,
        subsystem: AiSubsystemNameEnum.STT
    },
    {
        id: AiModelStorageIdEnum.LEGACY_EMBEDDING,
        path: ['nomic-embed-text-v2-moe.Q8_0.gguf'],
        isCurrent: false,
        subsystem: null
    },
    {
        id: AiModelStorageIdEnum.LEGACY_CHAT,
        path: ['qwen2.5-1.5b-instruct-q8_0.gguf'],
        isCurrent: false,
        subsystem: null
    },
    {
        id: AiModelStorageIdEnum.LEGACY_STT,
        path: [WHISPER_MODEL_FILENAME],
        isCurrent: false,
        subsystem: AiSubsystemNameEnum.STT
    },
    {
        id: AiModelStorageIdEnum.PARTIAL_STT,
        path: [WHISPER_MODEL_DIRECTORY, WHISPER_MODEL_TEMP_FILENAME],
        isCurrent: false,
        subsystem: AiSubsystemNameEnum.STT
    }
];
