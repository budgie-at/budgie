import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { AITransactionInterface } from '../interface/ai-transaction.interface';
import { LlmType } from '../type/llm.type';
import { parseNumberFromMessage } from '../util/parse-number-words.util';

type CategoryItem = { id: number; title: string };

const extractCategoryIndex = (response: string): number | null => {
    const match = /\d+/u.exec(response);

    return isDefined(match) ? parseInt(match[0], 10) : null;
};

const findCategoryByTitle = (response: string, categories: CategoryItem[]): number | null => {
    const normalized = response.trim().toLowerCase();

    const exact = categories.find(cat => cat.title.toLowerCase() === normalized);
    if (isDefined(exact)) {
        return exact.id;
    }

    const contains = categories.find(cat => normalized.includes(cat.title.toLowerCase()) || cat.title.toLowerCase().includes(normalized));
    if (isDefined(contains)) {
        return contains.id;
    }

    const [firstWord] = normalized.split(/\s+/u);

    return categories.find(cat => cat.title.toLowerCase().startsWith(firstWord))?.id ?? null;
};

export const useAiTransaction = (llm: LlmType, prompt: string) => {
    const { t } = useLingui();

    const { categories } = useAllCategoriesQuery();

    const [aiTransaction, setAiTransaction] = useState<AITransactionInterface | null>(null);

    const categoriesWithIds = categories.map((category, index) => `${index + 1}. ${category.title}`).join('\n');
    const categoryCount = categories.length;
    const systemPrompt = t`Categorize this expense. Reply with ONLY a number (1-${categoryCount}).

Categories:
${categoriesWithIds}

IMPORTANT: Food items (meat, vegetables, groceries) go to Groceries/Food category, NOT Stock/Investment.
Reply with the category number only.`;

    const reset = () => void setAiTransaction(null);
    const fillCategory = (categoryId: number) => {
        setAiTransaction({
            category: categories.find(category => category.id === categoryId) ?? null,
            amount: parseNumberFromMessage(prompt),
            type: TransactionTypeEnum.EXPENSE,
            comment: prompt
        });
    };

    useEffect(() => {
        if (!llm.isGenerating && isNotEmptyString(llm.response)) {
            const indexFromResponse = extractCategoryIndex(llm.response);
            const categoryByIndex = isDefined(indexFromResponse) ? categories[indexFromResponse - 1] : null;

            if (isDefined(categoryByIndex)) {
                fillCategory(categoryByIndex.id);
            } else {
                const categoryId = findCategoryByTitle(llm.response, categories);
                fillCategory(categoryId ?? 0);
            }
        }
    }, [llm.response, llm.isGenerating, categories, fillCategory]);

    return [systemPrompt, aiTransaction, reset, fillCategory] as const;
};
