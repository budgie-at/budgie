import { AITransactionInterface, findAccountByCurrency } from '@budgie/ai';
import { AccountWithInstrumentEntityInterface, CategoryEntityInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useState } from 'react';

import { getErrorMessage, isNotEmptyArray } from '@rnw-community/shared';

import { useSearchAccountsSortedQuery } from '../../account/query/use-search-accounts-sorted.query';
import { useNonSystemCategoriesQuery } from '../../category/query/use-non-system-categories.query';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { aiModelResidencyService } from '../service/ai-model-residency.service';
import { embeddingSuggestionService } from '../service/embedding-suggestion.service';
import { voiceService } from '../service/voice.service';

type CategorizationStatus = 'idle' | 'processing' | 'done' | 'error';

const VOICE_SUBSYSTEMS = [AiSubsystemNameEnum.CHAT, AiSubsystemNameEnum.EMBEDDING] as const;

interface UseLlmCategorizationReturnInterface {
    readonly status: CategorizationStatus;
    readonly transactions: AITransactionInterface[];
    readonly error: string | null;
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

const extractAndMapTransactions = async (
    text: string,
    accounts: AccountWithInstrumentEntityInterface[],
    categories: CategoryEntityInterface[]
): Promise<AITransactionInterface[]> => {
    const extracted = await voiceService.extractTransactions(text);

    if (!isNotEmptyArray(extracted)) {
        // oxlint-disable-next-line lingui/no-unlocalized-strings -- Internal error, not user-facing
        throw new Error('Failed to extract transactions from text');
    }

    return Promise.all(
        extracted.map(async item => ({
            category: await suggestCategoryFor(item.description, categories),
            amount: item.amount,
            currency: item.currency,
            account: findAccountByCurrency(accounts, item.currency),
            type: TransactionTypeEnum.EXPENSE,
            comment: item.description
        }))
    );
};

export const useLlmCategorization = (): UseLlmCategorizationReturnInterface => {
    const { accounts } = useSearchAccountsSortedQuery();
    const { categories } = useNonSystemCategoriesQuery();
    const [status, setStatus] = useState<CategorizationStatus>('idle');
    const [transactions, setTransactions] = useState<AITransactionInterface[]>([]);
    const [error, setError] = useState<string | null>(null);

    const categorize = async (text: string): Promise<AITransactionInterface[]> => {
        setStatus('processing');
        setError(null);
        setTransactions([]);

        await Promise.all(VOICE_SUBSYSTEMS.map(subsystem => aiModelResidencyService.acquire(subsystem)));

        try {
            const results = await extractAndMapTransactions(text, accounts, categories);
            setTransactions(results);
            setStatus('done');

            return results;
        } catch (err: unknown) {
            setError(getErrorMessage(err));
            setStatus('error');
            throw err;
        } finally {
            VOICE_SUBSYSTEMS.forEach(subsystem => {
                aiModelResidencyService.release(subsystem);
            });
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
        categorize,
        reset
    };
};
