import { TransactionTypeEnum } from '@budgie/contracts';
import { useEffect, useState } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

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

const MAX_CATEGORIES = 200;

const extractCategoryIndex = (response: string): number | null => {
    const match = /\d+/u.exec(response);

    return isDefined(match) ? parseInt(match[0], 10) : null;
};

const findCategoryByTitle = <T extends { title: string }>(response: string, categories: T[]): T | undefined => {
    const normalized = response.trim().toLowerCase();
    const words = normalized.split(/\s+/u);

    const exact = categories.find(cat => cat.title.toLowerCase() === normalized);
    if (isDefined(exact)) {
        return exact;
    }

    const contains = categories.find(cat => normalized.includes(cat.title.toLowerCase()) || cat.title.toLowerCase().includes(normalized));
    if (isDefined(contains)) {
        return contains;
    }

    for (const word of words) {
        const match = categories.find(cat => cat.title.toLowerCase().includes(word) || word.includes(cat.title.toLowerCase()));
        if (isDefined(match)) {
            return match;
        }
    }

    // eslint-disable-next-line no-undefined
    return undefined;
};

export const useCategorization = (callbacks: CategorizationCallbacks = {}): UseCategorizationReturn => {
    const { onDone, onError } = callbacks;

    const { llm } = useLlmContext();
    const { categories } = useAllCategoriesQuery();

    const [status, setStatus] = useState<CategorizationStatus>('idle');
    const [transaction, setTransaction] = useState<AITransactionInterface | null>(null);
    const [error, setError] = useState('');
    const [pendingText, setPendingText] = useState('');

    const limitedCategories = categories.slice(0, MAX_CATEGORIES);
    const categoriesWithIds = limitedCategories.map((category, index) => `${index + 1}=${category.title}`).join(', ');

    const buildTransaction = (prompt: string, llmResponse: string): AITransactionInterface => {
        const indexFromResponse = extractCategoryIndex(llmResponse);
        // eslint-disable-next-line no-undefined
        const categoryByIndex = isDefined(indexFromResponse) ? limitedCategories[indexFromResponse - 1] : undefined;
        const categoryByTitle = findCategoryByTitle(llmResponse, categories);

        return {
            category: categoryByIndex ?? categoryByTitle ?? null,
            amount: parseNumberFromMessage(prompt),
            type: TransactionTypeEnum.EXPENSE,
            comment: prompt
        };
    };

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

        const textForCategorization = stripAmountsFromText(text);

        /* eslint-disable lingui/no-unlocalized-strings -- LLM prompts and few-shot examples, not user-facing */
        const systemPrompt = `You categorize expenses. Categories: ${categoriesWithIds}. Reply ONLY with the category number.`;
        const messages = [
            { role: 'system' as const, content: systemPrompt },
            { role: 'user' as const, content: 'Coffee at Starbucks' },
            { role: 'assistant' as const, content: '12' },
            { role: 'user' as const, content: 'Uber' },
            { role: 'assistant' as const, content: '13' },
            { role: 'user' as const, content: 'Bread and milk' },
            { role: 'assistant' as const, content: '11' },
            { role: 'user' as const, content: textForCategorization }
        ];
        /* eslint-enable lingui/no-unlocalized-strings */

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
