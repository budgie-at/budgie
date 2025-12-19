import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { useLLM } from 'react-native-executorch';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { parseNumberFromMessage } from '../util/parse-number-words.util';

export const useTransactionInfoPrompt = (llm: ReturnType<typeof useLLM>, prompt: string) => {
    const { t } = useLingui();

    const { categories } = useAllCategoriesQuery();

    const [transactionInfo, setTransactionInfo] = useState<{ categoryId: number; amount: number; type: TransactionTypeEnum }>();

    const categoriesList = categories.map(category => category.title).join(', ');
    const systemPrompt = t`Your goal is to return ONE best matching category, ONLY THE NAME FROM this list <CategoryList>${categoriesList}</CategoryList> based on the user message, no reply, no additional text, just the category from the list.`;

    useEffect(() => {
        if (!llm.isGenerating && isNotEmptyString(llm.response)) {
            try {
                // eslint-disable-next-line no-undefined
                setTransactionInfo(undefined);
                const categoryId = categories.find(category => category.title.toLowerCase().includes(llm.response.toLowerCase()))?.id ?? 0;

                // TODO: Can we do better?
                setTransactionInfo({
                    categoryId,
                    amount: parseNumberFromMessage(prompt),
                    type: TransactionTypeEnum.EXPENSE
                });
            } catch (e: unknown) {
                // eslint-disable-next-line no-console
                console.log(getErrorMessage(e));
            }
        }
    }, [llm.response, llm.isGenerating, categories]);

    // eslint-disable-next-line no-undefined
    return [systemPrompt, transactionInfo, () => void setTransactionInfo(undefined)] as const;
};
