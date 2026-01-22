import { AccountWithInstrumentEntityInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useMemo, useState } from 'react';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { useSearchAccountsSortedQuery } from '../../account/query/use-search-accounts-sorted.query';
import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { AITransactionInterface } from '../interface/ai-transaction.interface';
import { buildCategorizationPrompt, extractAndMapResponse } from '../util/build-categorization-prompt.util';
import { findAccountByCurrency } from '../util/find-account-by-currency.util';

import { useCategoryMapping } from './use-category-mapping.hook';
import { useLlm } from './use-llm.hook';

type CategorizationStatus = 'idle' | 'processing' | 'done' | 'error';

/* eslint-disable lingui/no-unlocalized-strings */
class LlmParseError extends Error {
    constructor() {
        super('LLM parse error');
        this.name = 'LlmParseError';
    }
}
/* eslint-enable lingui/no-unlocalized-strings */

interface UseLlmCategorizationReturnInterface {
    status: CategorizationStatus;
    transaction: AITransactionInterface | null;
    error: string | null;
    isReady: boolean;
    downloadProgress: number;
    categorize: (text: string) => Promise<AITransactionInterface>;
    reset: () => void;
}

export const useLlmCategorization = (): UseLlmCategorizationReturnInterface => {
    const { categories } = useAllCategoriesQuery();
    const { accounts } = useSearchAccountsSortedQuery();
    const language = useSetting('language');

    const { mapping, isLoading: isMappingLoading } = useCategoryMapping(categories, language);
    const systemPrompt = useMemo(() => buildCategorizationPrompt(mapping), [mapping]);
    const llm = useLlm({ systemPrompt });

    const [status, setStatus] = useState<CategorizationStatus>('idle');
    const [transaction, setTransaction] = useState<AITransactionInterface | null>(null);
    const [error, setError] = useState<string | null>(null);

    const buildTransaction = (
        prompt: string,
        categoryId: number,
        amount: number,
        accountsList: AccountWithInstrumentEntityInterface[]
    ): AITransactionInterface => {
        const category = categories.find(cat => cat.id === categoryId) ?? null;

        return {
            category,
            amount,
            currency: null,
            account: findAccountByCurrency(accountsList, null),
            type: TransactionTypeEnum.EXPENSE,
            comment: prompt
        };
    };

    const categorize = async (text: string): Promise<AITransactionInterface> => {
        setStatus('processing');
        setError(null);
        setTransaction(null);

        try {
            const rawResponse = await llm.sendMessage(text);
            const mapped = extractAndMapResponse(rawResponse, mapping);

            if (!isDefined(mapped)) {
                throw new LlmParseError();
            }

            const result = buildTransaction(text, mapped.categoryId, mapped.amount, accounts);
            setTransaction(result);
            setStatus('done');

            return result;
        } catch (e: unknown) {
            setError(getErrorMessage(e));
            setStatus('error');
            throw e;
        }
    };

    const reset = () => {
        llm.interrupt();
        setStatus('idle');
        setTransaction(null);
        setError(null);
    };

    return {
        status,
        transaction,
        error,
        isReady: llm.isReady && !isMappingLoading,
        downloadProgress: llm.downloadProgress,
        categorize,
        reset
    };
};
