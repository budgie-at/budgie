import { TransactionTypeEnum } from '@budgie/contracts';
import { useState } from 'react';

import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { useLlmContext } from '../context/llm.context';
import { AITransactionInterface } from '../interface/ai-transaction.interface';
import { buildCategorizationPrompt, getLimitedCategories } from '../util/build-categorization-prompt.util';
import { extractCategoryFromResponse } from '../util/extract-category-from-response.util';
import { parseNumberFromMessage } from '../util/parse-number-words.util';

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
    const { llm } = useLlmContext();
    const { categories } = useAllCategoriesQuery();

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

    // eslint-disable-next-line max-statements
    const categorize = async (text: string): Promise<AITransactionInterface> => {
        if (llm.isGenerating) {
            llm.interrupt();
        }

        setStatus('processing');
        setError(null);
        setTransaction(null);

        const messages = buildCategorizationPrompt(text, categories);

        try {
            await llm.generate(messages);

            const result = buildTransaction(text, llm.response);
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
        if (llm.isGenerating) {
            llm.interrupt();
        }
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
