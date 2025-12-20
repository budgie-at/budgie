import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useCallback, useEffect, useState } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { AITransactionInterface } from '../interface/ai-transaction.interface';
import { LlmType } from '../type/llm.type';
import { parseNumberFromMessage } from '../util/parse-number-words.util';

export const useAiTransaction = (llm: LlmType, prompt: string) => {
    const { t } = useLingui();

    const { categories } = useAllCategoriesQuery();

    const [aiTransaction, setAiTransaction] = useState<AITransactionInterface | null>(null);

    const categoriesList = categories.map(category => category.title).join(', ');
    const systemPrompt = t`Your goal is to return ONE best matching category, ONLY THE NAME FROM this list <CategoryList>${categoriesList}</CategoryList> based on the user message, no reply, no additional text, just the category from the list.`;

    const reset = () => void setAiTransaction(null);
    const fillCategory = useCallback(
        (categoryId: number) => {
            setAiTransaction({
                category: categories.find(category => category.id === categoryId) ?? null,
                amount: parseNumberFromMessage(prompt),
                type: TransactionTypeEnum.EXPENSE
            });
        },
        [categories, prompt]
    );

    useEffect(() => {
        if (!llm.isGenerating && isNotEmptyString(llm.response)) {
            const categoryId = categories.find(category => category.title.toLowerCase().includes(llm.response.toLowerCase()))?.id;
            fillCategory(categoryId ?? 0);
        }
    }, [llm.response, llm.isGenerating, categories, prompt, fillCategory]);

    return [systemPrompt, aiTransaction, reset, fillCategory] as const;
};
