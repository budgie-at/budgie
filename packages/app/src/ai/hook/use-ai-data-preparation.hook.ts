import { TranslationLlmService } from '@budgie/ai';
import { t } from '@lingui/core/macro';
import { useEffect, useRef, useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { categoryRepository, commentEmbeddingRepository, merchantEmbeddingRepository, tagRepository } from '../../@generic/drizzle/db/db';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { useAiEmbeddingProgressContext } from '../context/ai-embedding-progress.context';
import { useLlmContext } from '../context/llm.context';
import { processCommentBatches } from '../utils/process-comment-batches.util';
import { processMerchantBatches } from '../utils/process-merchant-batches.util';

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
    const { llm } = useLlmContext();
    const { refreshProgress, setIsEmbedding } = useAiEmbeddingProgressContext();
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [phaseLabel, setPhaseLabel] = useState('');
    const [embeddedCount, setEmbeddedCount] = useState(0);
    const [totalContexts, setTotalContexts] = useState(0);
    const isRunningRef = useRef(false);

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
        console.log('[AI-PREP] run called:', { fresh, isRunning: isRunningRef.current, isLlmReady: llm.isReady }); // eslint-disable-line no-console, lingui/no-unlocalized-strings
        if (isRunningRef.current) {
            console.log('[AI-PREP] Already running, skipping'); // eslint-disable-line no-console, lingui/no-unlocalized-strings

            return;
        }

        if (!llm.isReady) {
            console.log('[AI-PREP] LLM not ready, showing toast'); // eslint-disable-line no-console, lingui/no-unlocalized-strings
            Toast.show({ type: 'info', text1: t`AI model is loading, please wait...` });

            return;
        }

        console.log('[AI-PREP] Starting data preparation...'); // eslint-disable-line no-console, lingui/no-unlocalized-strings
        isRunningRef.current = true;
        setIsRunning(true);
        setIsEmbedding(true);
        setProgress(0);
        await microPause();

        try {
            if (fresh) {
                console.log('[AI-PREP] Clearing old data...'); // eslint-disable-line no-console, lingui/no-unlocalized-strings
                setPhaseLabel(t`Clearing old data...`);
                await microPause();
                await merchantEmbeddingRepository.truncate();
                await commentEmbeddingRepository.truncate();
                refreshProgress();
            }

            const categories = fresh ? await categoryRepository.findAllNonSystem() : await categoryRepository.findWithoutTags();
            const tags = fresh ? await tagRepository.findAll() : await tagRepository.findWithoutTags();
            console.log('[AI-PREP] Found:', { categories: categories.length, tags: tags.length }); // eslint-disable-line no-console, lingui/no-unlocalized-strings

            const merchantKeys = fresh ? [] : await merchantEmbeddingRepository.findAllContextKeys();
            const commentKeys = fresh ? [] : await commentEmbeddingRepository.findAllContextKeys();
            const existingMerchantKeys = new Set(merchantKeys);
            const existingCommentKeys = new Set(commentKeys);
            const totalExisting = existingMerchantKeys.size + existingCommentKeys.size;

            setTotalContexts(totalExisting);
            setEmbeddedCount(totalExisting);
            await microPause();

            let completedSteps = 0;
            let totalSteps = categories.length + tags.length;
            const updateProgress = () => {
                completedSteps += 1;
                const percent = totalSteps === 0 ? 100 : Math.round((completedSteps / totalSteps) * 100);
                setProgress(Math.min(100, percent));
            };
            const addSteps = (count: number) => {
                totalSteps += count;
            };

            const translationService = new TranslationLlmService(llm);

            /* eslint-disable no-await-in-loop -- Sequential LLM processing */
            console.log('[AI-PREP] Phase: Translating categories...'); // eslint-disable-line no-console, lingui/no-unlocalized-strings
            setPhaseLabel(t`Translating categories...`);
            await microPause();
            for (const category of categories) {
                console.log('[AI-PREP] Translating category:', category.title); // eslint-disable-line no-console, lingui/no-unlocalized-strings
                const result = await translationService.translate(category.title);
                console.log('[AI-PREP] Category result:', result); // eslint-disable-line no-console, lingui/no-unlocalized-strings
                await categoryRepository.updateTranslation(category.id, result.titleEn, result.titleTags);
                updateProgress();
                await microPause();
            }

            console.log('[AI-PREP] Phase: Translating tags...'); // eslint-disable-line no-console, lingui/no-unlocalized-strings
            setPhaseLabel(t`Translating tags...`);
            await microPause();
            for (const tag of tags) {
                console.log('[AI-PREP] Translating tag:', tag.title); // eslint-disable-line no-console, lingui/no-unlocalized-strings
                const result = await translationService.translate(tag.title);
                console.log('[AI-PREP] Tag result:', result); // eslint-disable-line no-console, lingui/no-unlocalized-strings
                await tagRepository.updateTranslation(tag.id, result.titleEn, result.titleTags);
                updateProgress();
                await microPause();
            }
            /* eslint-enable no-await-in-loop */

            console.log('[AI-PREP] Phase: Generating merchant embeddings...'); // eslint-disable-line no-console, lingui/no-unlocalized-strings
            setPhaseLabel(t`Generating merchant embeddings...`);
            await microPause();
            await processMerchantBatches(llm, existingMerchantKeys, {
                onStep: updateProgress,
                onBatchDiscovered: addSteps,
                onEmbeddingStored: (count: number) => {
                    setEmbeddedCount(count + existingCommentKeys.size);
                }
            });

            console.log('[AI-PREP] Phase: Generating comment embeddings...'); // eslint-disable-line no-console, lingui/no-unlocalized-strings
            setPhaseLabel(t`Generating comment embeddings...`);
            await microPause();
            await processCommentBatches(llm, existingCommentKeys, {
                onStep: updateProgress,
                onBatchDiscovered: addSteps,
                onEmbeddingStored: (count: number) => {
                    setEmbeddedCount(existingMerchantKeys.size + count);
                }
            });

            console.log('[AI-PREP] All phases complete!'); // eslint-disable-line no-console, lingui/no-unlocalized-strings
            setIsEmbedding(false);
            setProgress(100);
            setPhaseLabel(t`Done`);
            setTotalContexts(existingMerchantKeys.size + existingCommentKeys.size);
            refreshProgress();
        } catch (error: unknown) {
            console.log('[AI-PREP] Error:', getErrorMessage(error)); // eslint-disable-line no-console, lingui/no-unlocalized-strings
            setProgress(0);
            setPhaseLabel('');
            Toast.show({
                type: 'error',
                text1: t`AI data preparation failed`,
                text2: getErrorMessage(error)
            });
        } finally {
            isRunningRef.current = false; // eslint-disable-line require-atomic-updates -- Intentional: ref is only written by this function
            setIsEmbedding(false);
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
        isLlmReady: llm.isReady,
        isLlmInitializing: llm.isInitializing,
        llmDownloadProgress: llm.downloadProgress
    };
};
