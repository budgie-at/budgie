import { AccountWithInstrumentEntityInterface, CategoryEntityInterface, CurrencyEnum, TransactionTypeEnum } from '@budgie/contracts';
import { useState } from 'react';

import { getErrorMessage, isNotEmptyArray } from '@rnw-community/shared';

import { useSearchAccountsSortedQuery } from '../../account/query/use-search-accounts-sorted.query';
import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { useLlmContext } from '../context/llm.context';
import { AITransactionInterface } from '../interface/ai-transaction.interface';
import { CategoryLlmService, ExtractedTransaction } from '../service/category-llm.service';
import { findAccountByCurrency } from '../util/find-account-by-currency.util';

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

const mapExtractedToTransactions = (
    extracted: ExtractedTransaction[],
    comment: string,
    accounts: AccountWithInstrumentEntityInterface[],
    categories: CategoryEntityInterface[]
): AITransactionInterface[] =>
    extracted.map(item =>
        buildTransaction({ comment, categoryId: item.categoryId, amount: item.amount, currency: item.currency, accounts, categories })
    );

export const useLlmCategorization = (): UseLlmCategorizationReturnInterface => {
    const { categories } = useAllCategoriesQuery();
    const { accounts } = useSearchAccountsSortedQuery();
    const { llm } = useLlmContext();

    const [status, setStatus] = useState<CategorizationStatus>('idle');
    const [transactions, setTransactions] = useState<AITransactionInterface[]>([]);
    const [error, setError] = useState<string | null>(null);

    const categorize = async (text: string): Promise<AITransactionInterface[]> => {
        setStatus('processing');
        setError(null);
        setTransactions([]);

        try {
            const service = new CategoryLlmService(llm);
            const extracted = await service.extractTransactionsFromText({ text, categories });

            if (!isNotEmptyArray(extracted)) {
                // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error, not user-facing
                throw new Error('Failed to extract transactions from text');
            }

            const results = mapExtractedToTransactions(extracted, text, accounts, categories);
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
