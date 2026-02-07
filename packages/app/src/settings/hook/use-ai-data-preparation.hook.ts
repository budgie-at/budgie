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
import { useLlmContext } from '../../ai/context/llm.context';

interface TransactionContextDataInterface {
    readonly title: string;
    readonly context: string;
}

interface UseAiDataPreparationReturn {
    readonly start: () => Promise<void>;
    readonly isRunning: boolean;
    readonly progress: number;
    readonly phaseLabel: string;
    readonly embeddedCount: number;
    readonly totalContexts: number;
}

interface ProgressCallbackInterface {
    readonly onStep: () => void;
    readonly onEmbeddingStored: (contextCount: number) => void;
}

const buildContextData = (transactionData: UnembeddedTransactionDataInterface[]): TransactionContextDataInterface[] =>
    transactionData
        .map(row => {
            const context = buildTransactionContext(row.title, row.mccFullDescription, row.comment, {
                categoryName: row.categoryTitleEn,
                tagNames: row.tagTitlesEn
            });

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
        }
    }
};

const MAX_CONSECUTIVE_FAILURES = 3;

// eslint-disable-next-line max-statements -- Batch processing with error recovery requires multiple state variables
const processEmbeddingBatches = async (
    llm: LlmInterface,
    existingContexts: Set<string>,
    callbacks: ProgressCallbackInterface
): Promise<void> => {
    const embeddingService = new EmbeddingService(llm);
    let cursor: number | undefined;
    let hasMore = true;
    let consecutiveFailures = 0;

    /* eslint-disable no-await-in-loop -- Sequential batch processing to avoid overwhelming the device */
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
                await storeEmbeddingBatch(unembeddedContexts, embeddings, existingContexts, callbacks);
            }

            hasMore = transactionData.length === EMBEDDING_BATCH_LIMIT;
            consecutiveFailures = 0;
            cursor = transactionData[transactionData.length - 1].maxOperatedAt;
        } catch {
            consecutiveFailures += 1;
        }
    }
    /* eslint-enable no-await-in-loop */
};

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
            const [embedded, total] = await Promise.all([
                titleEmbeddingRepository.countAll(),
                titleEmbeddingRepository.countDistinctTransactionContexts()
            ]);
            setEmbeddedCount(embedded);
            setTotalContexts(total);
        };

        void loadCounts();
    }, []);

    // eslint-disable-next-line max-statements -- Multi-phase sequential orchestration
    const start = async (): Promise<void> => {
        if (!llm.isReady || isRunningRef.current) {
            return;
        }

        isRunningRef.current = true;
        setIsRunning(true);
        setProgress(0);

        try {
            const categories = await categoryRepository.findWithoutTags();
            const tags = await tagRepository.findWithoutTags();

            const allContexts = await titleEmbeddingRepository.findAllContexts();
            const existingContexts = new Set(allContexts);
            const totalDistinctContexts = await titleEmbeddingRepository.countDistinctTransactionContexts();
            const estimatedUnembedded = Math.max(0, totalDistinctContexts - existingContexts.size);
            const totalSteps = categories.length + tags.length + estimatedUnembedded;

            setTotalContexts(totalDistinctContexts);
            setEmbeddedCount(existingContexts.size);

            let completedSteps = 0;
            const updateProgress = () => {
                completedSteps += 1;
                setProgress(Math.min(100, Math.round((completedSteps / totalSteps) * 100)));
            };

            const translationService = new TranslationLlmService(llm);

            /* eslint-disable no-await-in-loop -- Sequential LLM processing */
            setPhaseLabel(t`Translating categories...`);
            for (const category of categories) {
                const result = await translationService.translate(category.title);
                await categoryRepository.updateTranslation(category.id, result.titleEn, result.titleTags);
                updateProgress();
            }

            setPhaseLabel(t`Translating tags...`);
            for (const tag of tags) {
                const result = await translationService.translate(tag.title);
                await tagRepository.updateTranslation(tag.id, result.titleEn, result.titleTags);
                updateProgress();
            }
            /* eslint-enable no-await-in-loop */

            setPhaseLabel(t`Generating embeddings...`);
            await processEmbeddingBatches(llm, existingContexts, {
                onStep: updateProgress,
                onEmbeddingStored: (count: number) => void setEmbeddedCount(count)
            });

            setProgress(100);
            setPhaseLabel(t`Done`);
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

    return { start, isRunning, progress, phaseLabel, embeddedCount, totalContexts };
};
