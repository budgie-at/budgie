import { TransactionTypeEnum } from '@budgie/contracts';
import { useMemo, useState } from 'react';

import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { AITransactionInterface } from '../interface/ai-transaction.interface';
import { buildSystemPrompt, getFewShotExamples, getLimitedCategories } from '../util/build-categorization-prompt.util';
import { extractCategoryFromResponse } from '../util/extract-category-from-response.util';
import { parseNumberFromMessage } from '../util/parse-number-words.util';

import { useLlm } from './use-llm.hook';

type CategorizationStatus = 'idle' | 'processing' | 'done' | 'error';

interface UseLlmCategorizationReturn {
    status: CategorizationStatus;
    transaction: AITransactionInterface | null;
    error: string | null;
    isReady: boolean;
    downloadProgress: number;
    categorize: (text: string) => Promise<AITransactionInterface>;
    reset: () => void;
}

export const useLlmCategorization = (): UseLlmCategorizationReturn => {
    const { categories } = useAllCategoriesQuery();

    const systemPrompt = useMemo(() => buildSystemPrompt(categories), [categories]);
    const initialMessageHistory = useMemo(() => getFewShotExamples(), []);

    const llm = useLlm({ systemPrompt, initialMessageHistory });

    const [status, setStatus] = useState<CategorizationStatus>('idle');
    const [transaction, setTransaction] = useState<AITransactionInterface | null>(null);
    const [error, setError] = useState<string | null>(null);

    const limitedCategories = getLimitedCategories(categories);

    const buildTransaction = (prompt: string, llmResponse: string): AITransactionInterface => ({
        category: extractCategoryFromResponse(llmResponse, limitedCategories, categories),
        amount: parseNumberFromMessage(prompt),
        type: TransactionTypeEnum.EXPENSE,
        comment: prompt
    });

    const categorize = async (text: string): Promise<AITransactionInterface> => {
        setStatus('processing');
        setError(null);
        setTransaction(null);

        try {
            const response = await llm.sendMessage(text);
            const result = buildTransaction(text, response);

            setTransaction(result);
            setStatus('done');

            return result;
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            setError(errorMessage);
            setStatus('error');
            throw e;
        }
    };

    const reset = () => {
        void llm.interrupt();
        setStatus('idle');
        setTransaction(null);
        setError(null);
    };

    return {
        status,
        transaction,
        error,
        isReady: llm.isReady,
        downloadProgress: llm.downloadProgress,
        categorize,
        reset
    };
};
