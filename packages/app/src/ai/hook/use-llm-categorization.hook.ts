import { AccountWithInstrumentEntityInterface, CurrencyEnum, TransactionTypeEnum } from '@budgie/contracts';
import { useMemo, useState } from 'react';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { useSearchAccountsSortedQuery } from '../../account/query/use-search-accounts-sorted.query';
import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { AITransactionInterface } from '../interface/ai-transaction.interface';
import { LlmTransactionResponseInterface } from '../interface/llm-transaction-response.interface';
import { buildSystemPrompt, getLimitedCategories } from '../util/build-categorization-prompt.util';
import { findAccountByCurrency } from '../util/find-account-by-currency.util';
import { parseLlmTransactionResponse } from '../util/parse-llm-transaction-response.util';

import { useLlm } from './use-llm.hook';

type CategorizationStatus = 'idle' | 'processing' | 'done' | 'error';

/* eslint-disable lingui/no-unlocalized-strings -- Error messages are not user-facing */
class LlmParseError extends Error {
    constructor() {
        super('LLM parse error');
        this.name = 'LlmParseError';
    }
}
/* eslint-enable lingui/no-unlocalized-strings */

interface UseLlmCategorizationReturn {
    status: CategorizationStatus;
    transaction: AITransactionInterface | null;
    error: string | null;
    isReady: boolean;
    downloadProgress: number;
    categorize: (text: string) => Promise<AITransactionInterface>;
    reset: () => void;
}

const parseCurrency = (currencyStr: string | undefined): CurrencyEnum | null => {
    if (!isDefined(currencyStr)) {
        return null;
    }

    const upperCurrency = currencyStr.toUpperCase();

    return Object.values(CurrencyEnum).includes(upperCurrency as CurrencyEnum) ? (upperCurrency as CurrencyEnum) : null;
};

export const useLlmCategorization = (): UseLlmCategorizationReturn => {
    const { categories } = useAllCategoriesQuery();
    const { accounts } = useSearchAccountsSortedQuery();
    const systemPrompt = useMemo(() => buildSystemPrompt(categories), [categories]);
    const llm = useLlm({ systemPrompt });

    const [status, setStatus] = useState<CategorizationStatus>('idle');
    const [transaction, setTransaction] = useState<AITransactionInterface | null>(null);
    const [error, setError] = useState<string | null>(null);

    const limitedCategories = getLimitedCategories(categories);

    const buildTransaction = (
        prompt: string,
        parsed: LlmTransactionResponseInterface,
        accountsList: AccountWithInstrumentEntityInterface[]
    ): AITransactionInterface => {
        const currency = parseCurrency(parsed.currency);

        return {
            category: limitedCategories[parsed.categoryId - 1] ?? null,
            amount: parsed.amount,
            currency,
            account: findAccountByCurrency(accountsList, currency),
            type: TransactionTypeEnum.EXPENSE,
            comment: prompt
        };
    };

    const categorize = async (text: string): Promise<AITransactionInterface> => {
        setStatus('processing');
        setError(null);
        setTransaction(null);

        try {
            const response = await llm.sendMessage(text);
            const parsed = parseLlmTransactionResponse(response, text);

            if (!isDefined(parsed)) {
                throw new LlmParseError();
            }

            const result = buildTransaction(text, parsed, accounts);
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
        isReady: llm.isReady,
        downloadProgress: llm.downloadProgress,
        categorize,
        reset
    };
};
