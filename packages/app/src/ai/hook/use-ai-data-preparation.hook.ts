import { TranslationLlmService } from '@budgie/ai';
import { t } from '@lingui/core/macro';
import { useEffect, useRef, useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { categoryRepository, commentEmbeddingRepository, merchantEmbeddingRepository, tagRepository } from '../../@generic/drizzle/db/db';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { AiModeEnum } from '../enum/ai-mode.enum';
import { embeddingService } from '../service/embedding.service';
import { embeddingProgressStore } from '../store/embedding-progress.store';
import { isNativeCallSafe } from '../utils/is-native-call-safe.util';
import { processCommentBatches } from '../utils/process-comment-batches.util';
import { processMerchantBatches } from '../utils/process-merchant-batches.util';

import { useAiProgress } from './use-ai-progress.hook';
import { useAi } from './use-ai.hook';

interface UseAiDataPreparationReturn {
    readonly start: () => Promise<void>;
    readonly startFresh: () => Promise<void>;
    readonly isRunning: boolean;
    readonly progress: number;
    readonly phaseLabel: string;
    readonly embeddedCount: number;
    readonly totalContexts: number;
    readonly isLlmReady: boolean;
    readonly isLlmInitializing: boolean;
    readonly llmDownloadProgress: number;
}

// eslint-disable-next-line max-lines-per-function -- Multi-phase orchestration with LLM state management
export const useAiDataPreparation = (): UseAiDataPreparationReturn => {
    const { mode, llm } = useAi();
    const { downloadProgress } = useAiProgress();
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [phaseLabel, setPhaseLabel] = useState('');
    const [embeddedCount, setEmbeddedCount] = useState(0);
    const [totalContexts, setTotalContexts] = useState(0);
    const isRunningRef = useRef(false);
    const modeRef = useRef(mode);
    useEffect(() => {
        modeRef.current = mode;
    }, [mode]);

    useEffect(() => {
        const loadCounts = async (): Promise<void> => {
            const merchantCount = await merchantEmbeddingRepository.countAll();
            const commentCount = await commentEmbeddingRepository.countAll();
            const total = merchantCount + commentCount;
            setEmbeddedCount(total);
            setTotalContexts(total);
        };

        void loadCounts();
    }, []);

    // eslint-disable-next-line max-statements, max-lines-per-function -- Multi-phase sequential orchestration
    const run = async (fresh: boolean): Promise<void> => {
        if (isRunningRef.current) {
            return;
        }

        if (mode !== AiModeEnum.Ready) {
            Toast.show({ type: 'info', text1: t`AI model is loading, please wait...` });

            return;
        }

        isRunningRef.current = true;
        setIsRunning(true);
        setProgress(0);
        await microPause();

        try {
            if (fresh) {
                setPhaseLabel(t`Clearing old data...`);
                await microPause();
                await merchantEmbeddingRepository.truncate();
                await commentEmbeddingRepository.truncate();
                void embeddingProgressStore.refresh();
            }

            const categories = fresh ? await categoryRepository.findAllNonSystem() : await categoryRepository.findWithoutTags();
            const tags = fresh ? await tagRepository.findAll() : await tagRepository.findWithoutTags();

            const merchantKeys = fresh ? [] : await merchantEmbeddingRepository.findAllContextKeys();
            const commentKeys = fresh ? [] : await commentEmbeddingRepository.findAllContextKeys();
            const existingMerchantKeys = new Set(merchantKeys);
            const existingCommentKeys = new Set(commentKeys);
            const totalExisting = existingMerchantKeys.size + existingCommentKeys.size;
            const estimatedTotal = totalExisting + 100;
            const totalSteps = categories.length + tags.length + estimatedTotal;

            setTotalContexts(estimatedTotal);
            setEmbeddedCount(totalExisting);
            await microPause();

            let completedSteps = 0;
            const updateProgress = () => {
                completedSteps += 1;
                setProgress(Math.min(100, Math.round((completedSteps / totalSteps) * 100)));
            };

            const translationService = new TranslationLlmService(llm);

            /* eslint-disable no-await-in-loop -- Sequential LLM processing */
            setPhaseLabel(t`Translating categories...`);
            await microPause();
            for (const category of categories) {
                if (!isNativeCallSafe(modeRef.current)) {
                    break;
                }
                const result = await translationService.translate(category.title);
                await categoryRepository.updateTranslation(category.id, result.titleEn, result.titleTags);
                updateProgress();
                await microPause();
            }

            setPhaseLabel(t`Translating tags...`);
            await microPause();
            for (const tag of tags) {
                if (!isNativeCallSafe(modeRef.current)) {
                    break;
                }
                const result = await translationService.translate(tag.title);
                await tagRepository.updateTranslation(tag.id, result.titleEn, result.titleTags);
                updateProgress();
                await microPause();
            }
            /* eslint-enable no-await-in-loop */

            setPhaseLabel(t`Generating merchant embeddings...`);
            await microPause();
            await processMerchantBatches(embeddingService, existingMerchantKeys, {
                getMode: () => modeRef.current,
                onStep: updateProgress,
                onEmbeddingStored: (count: number) => {
                    setEmbeddedCount(count + existingCommentKeys.size);
                }
            });

            setPhaseLabel(t`Generating comment embeddings...`);
            await microPause();
            await processCommentBatches(embeddingService, existingCommentKeys, {
                getMode: () => modeRef.current,
                onStep: updateProgress,
                onEmbeddingStored: (count: number) => {
                    setEmbeddedCount(existingMerchantKeys.size + count);
                }
            });

            setProgress(100);
            setPhaseLabel(t`Done`);
            setTotalContexts(existingMerchantKeys.size + existingCommentKeys.size);
            void embeddingProgressStore.refresh();
        } catch (error: unknown) {
            Toast.show({
                type: 'error',
                text1: t`AI data preparation failed`,
                text2: getErrorMessage(error)
            });
        } finally {
            isRunningRef.current = false; // eslint-disable-line require-atomic-updates -- Intentional: ref is only written by this function
            setIsRunning(false);
        }
    };

    const start = async (): Promise<void> => run(false);
    const startFresh = async (): Promise<void> => run(true);

    return {
        start,
        startFresh,
        isRunning,
        progress,
        phaseLabel,
        embeddedCount,
        totalContexts,
        isLlmReady: mode === AiModeEnum.Ready,
        isLlmInitializing: mode === AiModeEnum.Initializing,
        llmDownloadProgress: downloadProgress
    };
};
