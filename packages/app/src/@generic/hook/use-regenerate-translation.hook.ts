import { TranslationLlmService, TranslationResultInterface } from '@budgie/ai';
import { LoggerNamespaceEnum, getLogger } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { AiSubsystemStatusEnum } from '../../ai/enum/ai-subsystem-status.enum';
import { useChat } from '../../ai/hook/use-chat.hook';
import { chatService } from '../../ai/service/chat.service';

const logger = getLogger(LoggerNamespaceEnum.AI);

type UpdateTranslationFn = (id: number, titleEn: string, titleTags: string) => Promise<void>;

export interface UseRegenerateTranslationReturn {
    readonly regenerate: (entityId: number, title: string) => Promise<TranslationResultInterface | null>;
    readonly isRegenerating: boolean;
    readonly error: string | null;
}

export const useRegenerateTranslation = (updateTranslation: UpdateTranslationFn): UseRegenerateTranslationReturn => {
    const { status: chatStatus } = useChat();
    const isChatReady = chatStatus === AiSubsystemStatusEnum.READY;
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // eslint-disable-next-line max-statements -- Lifecycle-guarded translate with structured logging and error capture
    const regenerate = async (entityId: number, title: string): Promise<TranslationResultInterface | null> => {
        if (!isChatReady) {
            logger.log('translation:regenerate:skip:not-ready', { chatStatus });
            setError(t`LLM not ready`);

            return null;
        }

        logger.log('translation:regenerate:start', { entityId, titleLen: title.length });
        setIsRegenerating(true);
        setError(null);

        try {
            const service = new TranslationLlmService(chatService);
            const result = await service.translate(title);
            await updateTranslation(entityId, result.titleEn, result.titleTags);
            logger.log('translation:regenerate:complete', { entityId, titleEnLen: result.titleEn.length });

            return result;
        } catch (regenerateError: unknown) {
            logger.error('translation:regenerate:throw', { errorMessage: getErrorMessage(regenerateError) });
            setError(getErrorMessage(regenerateError));

            return null;
        } finally {
            setIsRegenerating(false);
        }
    };

    return { regenerate, isRegenerating, error };
};
