import { AccountWithInstrumentEntityInterface, CategoryEntityInterface, CurrencyEnum, TransactionTypeEnum } from '@budgie/contracts';
import { useState } from 'react';

import { getErrorMessage, isNotEmptyArray, isNumber } from '@rnw-community/shared';

import { useSearchAccountsSortedQuery } from '../../account/query/use-search-accounts-sorted.query';
import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { FALLBACK_CATEGORY_ID } from '../constant/llm-categorization.constant';
import { AITransactionInterface } from '../interface/ai-transaction.interface';
import { buildDirectPrompt } from '../util/build-direct-prompt.util';
import { findAccountByCurrency } from '../util/find-account-by-currency.util';
import { ParsedCategorizationItemInterface, parseLlmJsonResponse } from '../util/parse-llm-json-response.util';

import { useLlm } from './use-llm.hook';

type CategorizationStatus = 'idle' | 'processing' | 'done' | 'error';

interface UseLlmCategorizationReturnInterface {
    status: CategorizationStatus;
    transactions: AITransactionInterface[];
    error: string | null;
    isReady: boolean;
    downloadProgress: number;
    categorize: (text: string) => Promise<AITransactionInterface[]>;
    reset: () => void;
}

const resolveCategoryId = (categoryId: number | string, categories: CategoryEntityInterface[]): number => {
    if (isNumber(categoryId)) {
        return categoryId;
    }

    const normalized = categoryId.toLowerCase().trim();
    const match = categories.find(category => category.title.toLowerCase() === normalized);

    return match?.id ?? FALLBACK_CATEGORY_ID;
};

interface BuildTransactionParamsInterface {
    comment: string;
    categoryId: number;
    amount: number;
    currency: CurrencyEnum | null;
    accounts: AccountWithInstrumentEntityInterface[];
    categories: CategoryEntityInterface[];
}

const buildTransaction = (params: BuildTransactionParamsInterface): AITransactionInterface => {
    const category = params.categories.find(category => category.id === params.categoryId) ?? null;

    return {
        category,
        amount: params.amount,
        currency: params.currency,
        account: findAccountByCurrency(params.accounts, params.currency),
        type: TransactionTypeEnum.EXPENSE,
        comment: params.comment
    };
};

const mapParsedToTransactions = (
    parsed: ParsedCategorizationItemInterface[],
    comment: string,
    accounts: AccountWithInstrumentEntityInterface[],
    categories: CategoryEntityInterface[]
): AITransactionInterface[] =>
    parsed.map(item => {
        const categoryId = resolveCategoryId(item.categoryId, categories);

        return buildTransaction({ comment, categoryId, amount: item.amount, currency: item.currency, accounts, categories });
    });

export const useLlmCategorization = (): UseLlmCategorizationReturnInterface => {
    const { categories } = useAllCategoriesQuery();
    const { accounts } = useSearchAccountsSortedQuery();
    const systemPrompt = buildDirectPrompt(categories);
    const llm = useLlm({ systemPrompt });

    const [status, setStatus] = useState<CategorizationStatus>('idle');
    const [transactions, setTransactions] = useState<AITransactionInterface[]>([]);
    const [error, setError] = useState<string | null>(null);

    const categorize = async (text: string): Promise<AITransactionInterface[]> => {
        setStatus('processing');
        setError(null);
        setTransactions([]);

        try {
            const response = await llm.sendMessage(text);
            const parsed = parseLlmJsonResponse(response);

            if (!isNotEmptyArray(parsed)) {
                // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error, not user-facing
                throw new Error(`Failed to parse LLM response: ${response}`);
            }

            const results = mapParsedToTransactions(parsed, text, accounts, categories);
            setTransactions(results);
            setStatus('done');

            return results;
        } catch (err: unknown) {
            setError(getErrorMessage(err));
            setStatus('error');
            throw err;
        }
    };

    const reset = (): void => {
        llm.interrupt();
        setStatus('idle');
        setTransactions([]);
        setError(null);
    };

    return {
        status,
        transactions,
        error,
        isReady: llm.isReady,
        downloadProgress: llm.downloadProgress,
        categorize,
        reset
    };
};
