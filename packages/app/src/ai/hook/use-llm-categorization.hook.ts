import { AITransactionInterface, ExtractedVoiceTransactionInterface, findAccountByCurrency } from '@budgie/ai';
import { AccountWithInstrumentEntityInterface, CategoryEntityInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useState } from 'react';

import { getErrorMessage, isNotEmptyArray } from '@rnw-community/shared';

import { useSearchAccountsSortedQuery } from '../../account/query/use-search-accounts-sorted.query';
import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { embeddingSuggestionService } from '../service/embedding-suggestion.service';
import { voiceService } from '../service/voice.service';

import { useAiDownloadProgress } from './use-ai-download-progress.hook';
import { useChat } from './use-chat.hook';

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

const suggestCategoryFor = async (description: string, categories: CategoryEntityInterface[]): Promise<CategoryEntityInterface | null> => {
    if (!isNotEmptyArray(categories)) {
        return null;
    }
    const suggestions = await embeddingSuggestionService.suggestCategories(categories, description, null, description, '', null);

    return suggestions[0] ?? null;
};

const mapExtractedToTransactions = async (
    extracted: ExtractedVoiceTransactionInterface[],
    accounts: AccountWithInstrumentEntityInterface[],
    categories: CategoryEntityInterface[]
): Promise<AITransactionInterface[]> =>
    Promise.all(
        extracted.map(async item => ({
            category: await suggestCategoryFor(item.description, categories),
            amount: item.amount,
            currency: item.currency,
            account: findAccountByCurrency(accounts, item.currency),
            type: TransactionTypeEnum.EXPENSE,
            comment: item.description
        }))
    );

export const useLlmCategorization = (): UseLlmCategorizationReturnInterface => {
    const { accounts } = useSearchAccountsSortedQuery();
    const { categories } = useAllCategoriesQuery();
    const { status: chatStatus } = useChat();
    const downloadProgress = useAiDownloadProgress();

    const [status, setStatus] = useState<CategorizationStatus>('idle');
    const [transactions, setTransactions] = useState<AITransactionInterface[]>([]);
    const [error, setError] = useState<string | null>(null);

    const categorize = async (text: string): Promise<AITransactionInterface[]> => {
        setStatus('processing');
        setError(null);
        setTransactions([]);

        try {
            const extracted = await voiceService.extractTransactions(text);

            if (!isNotEmptyArray(extracted)) {
                // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error, not user-facing
                throw new Error('Failed to extract transactions from text');
            }

            const results = await mapExtractedToTransactions(extracted, accounts, categories);
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
        isReady: chatStatus === AiSubsystemStatusEnum.READY,
        downloadProgress,
        categorize,
        reset
    };
};
