import { AITransactionInterface, ExtractedVoiceTransactionInterface, VoiceLlmService, findAccountByCurrency } from '@budgie/ai';
import { AccountWithInstrumentEntityInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useState } from 'react';

import { getErrorMessage, isNotEmptyArray } from '@rnw-community/shared';

import { useSearchAccountsSortedQuery } from '../../account/query/use-search-accounts-sorted.query';

import { useAi } from './use-ai.hook';

type CategorizationStatus = 'idle' | 'processing' | 'done' | 'error';

interface UseLlmCategorizationReturnInterface {
    readonly status: CategorizationStatus;
    readonly transactions: AITransactionInterface[];
    readonly error: string | null;
    readonly isReady: boolean;
    readonly downloadProgress: number;
    readonly categorize: (text: string) => Promise<AITransactionInterface[]>;
    readonly reset: () => void;
}

const mapExtractedToTransactions = (
    extracted: ExtractedVoiceTransactionInterface[],
    accounts: AccountWithInstrumentEntityInterface[]
): AITransactionInterface[] =>
    extracted.map(item => ({
        category: null,
        amount: item.amount,
        currency: item.currency,
        account: findAccountByCurrency(accounts, item.currency),
        type: TransactionTypeEnum.EXPENSE,
        comment: item.description
    }));

export const useLlmCategorization = (): UseLlmCategorizationReturnInterface => {
    const { accounts } = useSearchAccountsSortedQuery();
    const { llm } = useAi();

    const [status, setStatus] = useState<CategorizationStatus>('idle');
    const [transactions, setTransactions] = useState<AITransactionInterface[]>([]);
    const [error, setError] = useState<string | null>(null);

    const categorize = async (text: string): Promise<AITransactionInterface[]> => {
        setStatus('processing');
        setError(null);
        setTransactions([]);

        try {
            const service = new VoiceLlmService(llm);
            const extracted = await service.extractTransactions(text);

            if (!isNotEmptyArray(extracted)) {
                // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error, not user-facing
                throw new Error('Failed to extract transactions from text');
            }

            const results = mapExtractedToTransactions(extracted, accounts);
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
