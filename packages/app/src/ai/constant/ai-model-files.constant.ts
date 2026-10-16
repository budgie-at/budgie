import { EMBEDDING_MODEL_FILENAME, EMBEDDING_MODEL_URL } from '@budgie/categorization';

import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiModelFileInterface } from '../interface/ai-model-file.interface';
import { CHAT_MODEL_FILENAME, CHAT_MODEL_URL } from '../utils/ai-constants.util';

import { WHISPER_MODEL_DIRECTORY, WHISPER_MODEL_FILENAME, WHISPER_MODEL_URL } from './whisper-model.constant';

export const AI_MODEL_FILES: Readonly<Record<AiSubsystemNameEnum, AiModelFileInterface>> = {
    [AiSubsystemNameEnum.EMBEDDING]: {
        url: EMBEDDING_MODEL_URL,
        directory: null,
        filename: EMBEDDING_MODEL_FILENAME,
        estimatedBytes: 333_590_944
    },
    [AiSubsystemNameEnum.CHAT]: { url: CHAT_MODEL_URL, directory: null, filename: CHAT_MODEL_FILENAME, estimatedBytes: 1_107_409_472 },
    [AiSubsystemNameEnum.STT]: {
        url: WHISPER_MODEL_URL,
        directory: WHISPER_MODEL_DIRECTORY,
        filename: WHISPER_MODEL_FILENAME,
        estimatedBytes: 874_188_075
    }
};

export const AI_MODEL_DOWNLOAD_ORDER = [AiSubsystemNameEnum.EMBEDDING, AiSubsystemNameEnum.CHAT, AiSubsystemNameEnum.STT] as const;

export const AI_MODEL_FREE_SPACE_RESERVE_BYTES = 300_000_000;
