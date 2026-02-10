import {
    EMBEDDING_BATCH_LIMIT,
    EmbeddingService,
    LlmInterface,
    TranslationLlmService,
    buildTransactionContext,
    serializeEmbedding
} from '@budgie/ai';
import { UnembeddedTransactionDataInterface } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { useEffect, useRef, useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { categoryRepository, tagRepository, titleEmbeddingRepository } from '../../@generic/drizzle/db/db';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { useLlmContext } from '../../ai/context/llm.context';

interface TransactionContextDataInterface {
    readonly title: string;
    readonly context: string;
}

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

interface ProgressCallbackInterface {
    readonly onStep: () => void;
    readonly onEmbeddingStored: (contextCount: number) => void;
}

const buildContextData = (transactionData: UnembeddedTransactionDataInterface[]): TransactionContextDataInterface[] =>
    transactionData
        .map(row => {
            const context = buildTransactionContext(row.title, row.mccFullDescription, row.comment);

            if (!isNotEmptyString(context)) {
                return null;
            }

            return { title: row.title, context };
        })
        .filter(isDefined);

const filterUnembeddedContexts = (
    contextData: TransactionContextDataInterface[],
    existingContexts: Set<string>
): TransactionContextDataInterface[] => contextData.filter(item => !existingContexts.has(item.context));

const storeEmbeddingBatch = async (
    unembeddedContexts: TransactionContextDataInterface[],
    embeddings: Map<string, Float32Array>,
    existingContexts: Set<string>,
    callbacks: ProgressCallbackInterface
): Promise<void> => {
    for (const item of unembeddedContexts) {
        const embeddingVector = embeddings.get(item.context);

        if (isDefined(embeddingVector)) {
            const serialized = serializeEmbedding(embeddingVector);
            await titleEmbeddingRepository.upsert(item.title, item.context, serialized, embeddingVector.length); // eslint-disable-line no-await-in-loop -- Sequential DB writes for upsert consistency
            existingContexts.add(item.context);
            callbacks.onStep();
            callbacks.onEmbeddingStored(existingContexts.size);
            await microPause(); // eslint-disable-line no-await-in-loop -- Yield to render progress updates
        }
    }
};

const MAX_CONSECUTIVE_FAILURES = 3;

// eslint-disable-next-line max-statements -- Batch processing with error recovery
const processEmbeddingBatches = async (
    llm: LlmInterface,
    existingContexts: Set<string>,
    callbacks: ProgressCallbackInterface
): Promise<void> => {
    const embeddingService = new EmbeddingService(llm);
    let cursor: number | undefined;
    let hasMore = true;
    let consecutiveFailures = 0;

    /* eslint-disable no-await-in-loop -- Sequential batch processing */
    while (hasMore && consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
        try {
            const transactionData = await titleEmbeddingRepository.findTransactionData(EMBEDDING_BATCH_LIMIT, cursor);

            if (!isNotEmptyArray(transactionData)) {
                break;
            }

            const contextData = buildContextData(transactionData);
            const unembeddedContexts = filterUnembeddedContexts(contextData, existingContexts);

            if (isNotEmptyArray(unembeddedContexts)) {
                const contextStrings = unembeddedContexts.map(item => item.context);
                const embeddings = await embeddingService.generateEmbeddings(contextStrings);

                if (embeddings.size === 0) {
                    consecutiveFailures += 1;
                    cursor = transactionData[transactionData.length - 1].maxOperatedAt;
                } else {
                    await storeEmbeddingBatch(unembeddedContexts, embeddings, existingContexts, callbacks);
                }
            }

            if (consecutiveFailures === 0) {
                hasMore = transactionData.length === EMBEDDING_BATCH_LIMIT;
            }

            cursor = transactionData[transactionData.length - 1].maxOperatedAt;
        } catch {
            consecutiveFailures += 1;
        }
    }
    /* eslint-enable no-await-in-loop */
};

// eslint-disable-next-line max-lines-per-function -- Multi-phase orchestration with LLM state management
export const useAiDataPreparation = (): UseAiDataPreparationReturn => {
    const { llm } = useLlmContext();
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [phaseLabel, setPhaseLabel] = useState('');
    const [embeddedCount, setEmbeddedCount] = useState(0);
    const [totalContexts, setTotalContexts] = useState(0);
    const isRunningRef = useRef(false);

    useEffect(() => {
        const loadCounts = async (): Promise<void> => {
            const embedded = await titleEmbeddingRepository.countAll();
            setEmbeddedCount(embedded);
            setTotalContexts(embedded);
        };

        void loadCounts();
    }, []);

    // eslint-disable-next-line max-statements -- Multi-phase sequential orchestration
    const run = async (fresh: boolean): Promise<void> => {
        if (isRunningRef.current) {
            return;
        }

        if (!llm.isReady) {
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
                await titleEmbeddingRepository.truncate();
            }

            const categories = fresh ? await categoryRepository.findAllNonSystem() : await categoryRepository.findWithoutTags();
            const tags = fresh ? await tagRepository.findAll() : await tagRepository.findWithoutTags();

            const allContexts = fresh ? [] : await titleEmbeddingRepository.findAllContexts();
            const existingContexts = new Set(allContexts);
            const totalDistinctContexts = await titleEmbeddingRepository.countDistinctTransactionContexts();
            const estimatedUnembedded = Math.max(0, totalDistinctContexts - existingContexts.size);
            const totalSteps = categories.length + tags.length + estimatedUnembedded;

            setTotalContexts(totalDistinctContexts);
            setEmbeddedCount(existingContexts.size);
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
                const result = await translationService.translate(category.title);
                await categoryRepository.updateTranslation(category.id, result.titleEn, result.titleTags);
                updateProgress();
                await microPause();
            }

            setPhaseLabel(t`Translating tags...`);
            await microPause();
            for (const tag of tags) {
                const result = await translationService.translate(tag.title);
                await tagRepository.updateTranslation(tag.id, result.titleEn, result.titleTags);
                updateProgress();
                await microPause();
            }
            /* eslint-enable no-await-in-loop */

            setPhaseLabel(t`Generating embeddings...`);
            await microPause();
            await processEmbeddingBatches(llm, existingContexts, {
                onStep: updateProgress,
                onEmbeddingStored: (count: number) => void setEmbeddedCount(count)
            });

            setProgress(100);
            setPhaseLabel(t`Done`);
            setTotalContexts(existingContexts.size);
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
        isLlmReady: llm.isReady,
        isLlmInitializing: llm.isInitializing,
        llmDownloadProgress: llm.downloadProgress
    };
};
