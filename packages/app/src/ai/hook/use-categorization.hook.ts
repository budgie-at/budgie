import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { useLlmContext } from '../context/llm.context';
import { AITransactionInterface } from '../interface/ai-transaction.interface';
import { parseNumberFromMessage } from '../util/parse-number-words.util';
import { stripAmountsFromText } from '../util/strip-amounts-from-text.util';

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

const extractCategoryIndex = (response: string): number | null => {
    const match = /\d+/u.exec(response);

    return isDefined(match) ? parseInt(match[0], 10) : null;
};

type CategoryItem = { id: number; title: string };

const findCategoryByTitle = (response: string, categories: CategoryItem[]): number | null => {
    const normalized = response.trim().toLowerCase();
    const words = normalized.split(/\s+/u);

    const exact = categories.find(cat => cat.title.toLowerCase() === normalized);
    if (isDefined(exact)) {
        return exact.id;
    }

    const contains = categories.find(cat => normalized.includes(cat.title.toLowerCase()) || cat.title.toLowerCase().includes(normalized));
    if (isDefined(contains)) {
        return contains.id;
    }

    for (const word of words) {
        const match = categories.find(cat => cat.title.toLowerCase().includes(word) || word.includes(cat.title.toLowerCase()));
        if (isDefined(match)) {
            return match.id;
        }
    }

    return null;
};

export const useCategorization = (callbacks: CategorizationCallbacks = {}): UseCategorizationReturn => {
    const { onDone, onError } = callbacks;

    const { t } = useLingui();
    const { llm } = useLlmContext();
    const { categories } = useAllCategoriesQuery();

    const [status, setStatus] = useState<CategorizationStatus>('idle');
    const [transaction, setTransaction] = useState<AITransactionInterface | null>(null);
    const [error, setError] = useState('');

    const isProcessingRef = useRef(false);

    const categoriesWithIds = categories.map((category, index) => `${index + 1}. ${category.title}`).join('\n');
    const categoriesCount = categories.length;
    const systemPrompt = t`Which category number matches this expense? Reply with ONLY the number.

${categoriesWithIds}

Reply with the number only (1-${categoriesCount}):`;

    const buildTransaction = (prompt: string, llmResponse: string): AITransactionInterface => {
        const indexFromResponse = extractCategoryIndex(llmResponse);
        const categoryByIndex = isDefined(indexFromResponse) ? categories[indexFromResponse - 1] : null;
        const categoryById = categories.find(cat => cat.id === findCategoryByTitle(llmResponse, categories));
        const category = categoryByIndex ?? categoryById ?? null;

        return {
            category,
            amount: parseNumberFromMessage(prompt),
            type: TransactionTypeEnum.EXPENSE,
            comment: prompt
        };
    };

    const categorize = (text: string) => {
        if (isProcessingRef.current) {
            return;
        }
        isProcessingRef.current = true;
        setStatus('processing');

        const doCategorize = async () => {
            try {
                const textForCategorization = stripAmountsFromText(text);
                await llm.generate([
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: textForCategorization }
                ]);

                const result = buildTransaction(text, llm.response);
                setTransaction(result);
                setStatus('done');
                onDone?.(result);
            } catch (e: unknown) {
                if (!llm.isGenerating) {
                    const errorMessage = e instanceof Error ? e.message : String(e);
                    setError(errorMessage);
                    setStatus('error');
                    onError?.(errorMessage);
                }
            } finally {
                isProcessingRef.current = false;
            }
        };

        void doCategorize();
    };

    const reset = () => {
        setStatus('idle');
        setTransaction(null);
        setError('');
        isProcessingRef.current = false;
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
