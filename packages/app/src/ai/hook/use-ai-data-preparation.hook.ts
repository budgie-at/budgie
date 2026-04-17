import { TranslationLlmService } from '@budgie/ai';
import { t } from '@lingui/core/macro';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { categoryRepository, commentEmbeddingRepository, merchantEmbeddingRepository, tagRepository } from '../../@generic/drizzle/db/db';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { chatService } from '../service/chat.service';
import { embeddingService } from '../service/embedding.service';
import { embeddingProgressStore } from '../store/embedding-progress.store';
import { aiLog } from '../utils/ai-log.util';
import { processCommentBatches } from '../utils/process-comment-batches.util';
import { processMerchantBatches } from '../utils/process-merchant-batches.util';

import { useAiDownloadProgress } from './use-ai-download-progress.hook';
import { useChat } from './use-chat.hook';
import { useEmbedding } from './use-embedding.hook';

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

const isNativeSafe = (): boolean => AppState.currentState === 'active' && chatService.isReady && embeddingService.isReady;

// eslint-disable-next-line max-lines-per-function -- Multi-phase orchestration with LLM state management
export const useAiDataPreparation = (): UseAiDataPreparationReturn => {
    const chat = useChat();
    const embedding = useEmbedding();
    const downloadProgress = useAiDownloadProgress();
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
        if (isRunningRef.current) {
            return;
        }

        aiLog('prepare:start', { fresh });

        if (chat.status !== AiSubsystemStatusEnum.Ready || embedding.status !== AiSubsystemStatusEnum.Ready) {
            aiLog('prepare:skip:not-ready', { chatStatus: chat.status, embeddingStatus: embedding.status });
            Toast.show({ type: 'info', text1: t`AI model is loading, please wait...` });

            return;
        }

        isRunningRef.current = true;
        setIsRunning(true);
        setProgress(0);
        const started = Date.now();
        await microPause();

        try {
            if (fresh) {
                aiLog('prepare:phase', { name: 'clear' });
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

            const translationService = new TranslationLlmService(chatService);

            /* eslint-disable no-await-in-loop -- Sequential LLM processing */
            aiLog('prepare:phase', { name: 'category-translation', count: categories.length });
            setPhaseLabel(t`Translating categories...`);
            await microPause();
            for (const category of categories) {
                if (!isNativeSafe()) {
                    aiLog('prepare:skip:unsafe', { phase: 'category-translation' });
                    break;
                }
                const result = await translationService.translate(category.title);
                await categoryRepository.updateTranslation(category.id, result.titleEn, result.titleTags);
                updateProgress();
                await microPause();
            }

            aiLog('prepare:phase', { name: 'tag-translation', count: tags.length });
            setPhaseLabel(t`Translating tags...`);
            await microPause();
            for (const tag of tags) {
                if (!isNativeSafe()) {
                    aiLog('prepare:skip:unsafe', { phase: 'tag-translation' });
                    break;
                }
                const result = await translationService.translate(tag.title);
                await tagRepository.updateTranslation(tag.id, result.titleEn, result.titleTags);
                updateProgress();
                await microPause();
            }
            /* eslint-enable no-await-in-loop */

            aiLog('prepare:phase', { name: 'merchant-embeddings' });
            setPhaseLabel(t`Generating merchant embeddings...`);
            await microPause();
            await processMerchantBatches(embeddingService, existingMerchantKeys, {
                onStep: updateProgress,
                onEmbeddingStored: (count: number) => {
                    setEmbeddedCount(count + existingCommentKeys.size);
                }
            });

            aiLog('prepare:phase', { name: 'comment-embeddings' });
            setPhaseLabel(t`Generating comment embeddings...`);
            await microPause();
            await processCommentBatches(embeddingService, existingCommentKeys, {
                onStep: updateProgress,
                onEmbeddingStored: (count: number) => {
                    setEmbeddedCount(existingMerchantKeys.size + count);
                }
            });

            setProgress(100);
            setPhaseLabel(t`Done`);
            setTotalContexts(existingMerchantKeys.size + existingCommentKeys.size);
            void embeddingProgressStore.refresh();
            aiLog('prepare:complete', {
                durationMs: Date.now() - started,
                embeddedCount: existingMerchantKeys.size + existingCommentKeys.size
            });
        } catch (error: unknown) {
            aiLog('prepare:throw', { errorMessage: getErrorMessage(error) });
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
        isLlmReady: chat.status === AiSubsystemStatusEnum.Ready && embedding.status === AiSubsystemStatusEnum.Ready,
        isLlmInitializing:
            chat.status === AiSubsystemStatusEnum.Initializing ||
            chat.status === AiSubsystemStatusEnum.Downloading ||
            embedding.status === AiSubsystemStatusEnum.Initializing ||
            embedding.status === AiSubsystemStatusEnum.Downloading,
        llmDownloadProgress: downloadProgress
    };
};
