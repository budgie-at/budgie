import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { useLLM } from 'react-native-executorch';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { AITransactionInterface } from '../interface/ai-transaction.interface';
import { parseNumberFromMessage } from '../util/parse-number-words.util';

type CategoryItem = { id: number; title: string };

const extractCategoryIndex = (response: string): number | null => {
    const match = /\d+/u.exec(response);

    return isDefined(match) ? parseInt(match[0], 10) : null;
};

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

export const useAiTransaction = (llm: ReturnType<typeof useLLM>, prompt: string) => {
    const { t } = useLingui();

    const { categories } = useAllCategoriesQuery();

    const [aiTransaction, setAiTransaction] = useState<AITransactionInterface | null>(null);

    const categoriesWithIds = categories.map((category, index) => `${index + 1}. ${category.title}`).join('\n');
    const systemPrompt = t`Pick ONE category number for this expense.

${categoriesWithIds}

Food/pizza/coffee/restaurant = Food category
Taxi/uber/bus/train = Transport category
Salary/wages = Income category

Answer with just the number:`;

    const reset = () => void setAiTransaction(null);
    const fillCategory = (categoryId: number | null) => {
        setAiTransaction({
            category: categories.find(category => category.id === categoryId) ?? null,
            amount: parseNumberFromMessage(prompt),
            type: TransactionTypeEnum.EXPENSE,
            comment: prompt
        });
    };

    useEffect(() => {
        if (!llm.isGenerating && isNotEmptyString(llm.response)) {
            console.log('[LLM] Response:', llm.response);
            const indexFromResponse = extractCategoryIndex(llm.response);
            const categoryByIndex = isDefined(indexFromResponse) ? categories[indexFromResponse - 1] : null;
            console.log('[LLM] Parsed index:', indexFromResponse, '-> Category:', categoryByIndex?.title ?? 'null');

            if (isDefined(categoryByIndex)) {
                fillCategory(categoryByIndex.id);
            } else {
                const categoryId = findCategoryByTitle(llm.response, categories);
                fillCategory(categoryId);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [llm.response, llm.isGenerating, categories]);

    return [systemPrompt, aiTransaction, reset, fillCategory] as const;
};
