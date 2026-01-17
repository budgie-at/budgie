import { TransactionTypeEnum } from '@budgie/contracts';
import { useEffect, useState } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { useLlmContext } from '../context/llm.context';
import { AITransactionInterface } from '../interface/ai-transaction.interface';
import { buildCategorizationPrompt, getLimitedCategories } from '../util/build-categorization-prompt.util';
import { extractCategoryFromResponse } from '../util/extract-category-from-response.util';
import { parseNumberFromMessage } from '../util/parse-number-words.util';

type CategorizationStatus = 'idle' | 'processing' | 'done' | 'error';

interface CategorizationCallbacks {
    onDone?: (transaction: AITransactionInterface) => void;
    onError?: (error: string) => void;
}

interface UseCategorizationReturn {
    status: CategorizationStatus;
    transaction: AITransactionInterface | null;
    error: string;
    isReady: boolean;
    downloadProgress: number;
    categorize: (text: string) => void;
    reset: () => void;
}

export const useCategorization = (callbacks: CategorizationCallbacks = {}): UseCategorizationReturn => {
    const { onDone, onError } = callbacks;

    const { llm } = useLlmContext();
    const { categories } = useAllCategoriesQuery();

    const [status, setStatus] = useState<CategorizationStatus>('idle');
    const [transaction, setTransaction] = useState<AITransactionInterface | null>(null);
    const [error, setError] = useState('');
    const [pendingText, setPendingText] = useState('');

    const limitedCategories = getLimitedCategories(categories);

    const buildTransaction = (prompt: string, llmResponse: string): AITransactionInterface => ({
        category: extractCategoryFromResponse(llmResponse, limitedCategories, categories),
        amount: parseNumberFromMessage(prompt),
        type: TransactionTypeEnum.EXPENSE,
        comment: prompt
    });

    /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- Responding to external LLM state changes */
    useEffect(() => {
        if (llm.isGenerating || !isNotEmptyString(pendingText)) {
            return;
        }

        const originalText = pendingText;
        setPendingText('');

        if (isDefined(llm.error)) {
            setError(llm.error);
            setStatus('error');
            onError?.(llm.error);

            return;
        }

        const result = buildTransaction(originalText, llm.response);
        setTransaction(result);
        setStatus('done');
        onDone?.(result);
    }, [llm.isGenerating, llm.response, llm.error, pendingText, onDone, onError]);
    /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

    const categorize = (text: string) => {
        if (isNotEmptyString(pendingText)) {
            return;
        }

        setPendingText(text);
        setStatus('processing');

        const messages = buildCategorizationPrompt(text, categories);

        llm.generate(messages).catch((e: unknown) => {
            const errorMessage = e instanceof Error ? e.message : String(e);
            setError(errorMessage);
            setStatus('error');
            onError?.(errorMessage);
            setPendingText('');
        });
    };

    const reset = () => {
        setStatus('idle');
        setTransaction(null);
        setError('');
        setPendingText('');
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
