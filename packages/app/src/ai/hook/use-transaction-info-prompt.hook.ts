import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { getStructuredOutputPrompt, useLLM } from 'react-native-executorch';

import { getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { LLMParsedTransaction } from '../interface/llm-parsed-transaction.interface';
import { llmResponseParserUtil } from '../util/llm-response-parser.util';

export const useTransactionInfoPrompt = (llm: ReturnType<typeof useLLM>) => {
    const { t } = useLingui();

    const { categories } = useAllCategoriesQuery();

    const [transactionInfo, setTransactionInfo] = useState<{ categoryId: number; amount: number; type: TransactionTypeEnum }>();

    const schema = {
        properties: {
            category: {
                type: 'string',
                enum: categories.map(category => category.title),
                description: t`Available transaction categories`
            },
            type: {
                type: 'string',
                enum: Object.values(TransactionTypeEnum),
                description: t`Available transaction types`
            },
            amount: {
                type: 'number',
                description: t`Amount of money, that user spent or earned in this transaction`
            }
        },
        required: ['category', 'type', 'amount']
    };

    const systemPrompt = t`Your goal is to analyze and parse user message about the financial transaction and return them in JSON format. Don't respond to user. ONLY return JSON with user's transaction data parsed, NOTHING ELSE.`;

    useEffect(() => {
        if (!llm.isGenerating && isNotEmptyString(llm.response)) {
            try {
                const parsedTransaction = llmResponseParserUtil<LLMParsedTransaction>(llm.response);

                if (isDefined(parsedTransaction)) {
                    const categoryId =
                        categories.find(category => category.title.toLowerCase().includes(parsedTransaction.category.toLowerCase()))?.id ??
                        0;

                    // TODO: Can we do better?
                    // eslint-disable-next-line react-hooks/set-state-in-effect
                    setTransactionInfo({
                        categoryId,
                        amount: parsedTransaction.amount,
                        type: parsedTransaction.type ?? TransactionTypeEnum.EXPENSE
                    });
                }
            } catch (e: unknown) {
                // eslint-disable-next-line no-console
                console.log(getErrorMessage(e));
            }
        }
    }, [llm.response, llm.isGenerating, categories]);

    return [`${systemPrompt}\n${getStructuredOutputPrompt(schema)}`, transactionInfo] as const;
};
