import { AITransactionInterface, VoiceLlmService, findAccountByCurrency } from '@budgie/ai';
import { EmbeddingSuggestionService } from '@budgie/categorization';
import { AccountWithInstrumentEntityInterface, CategoryEntityInterface, TransactionTypeEnum } from '@budgie/contracts';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import { useState } from 'react';

import { isNotEmptyArray } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { useSearchAccountsSortedQuery } from '../../account/query/use-search-accounts-sorted.query';
import { useNonSystemCategoriesQuery } from '../../category/query/use-non-system-categories.query';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiModelResidencyService } from '../service/ai-model-residency.service';
import { getRootErrorMessage } from '../utils/get-root-error-message.util';

type CategorizationStatus = 'idle' | 'processing' | 'done' | 'error';

const VOICE_SUBSYSTEMS = [AiSubsystemNameEnum.CHAT, AiSubsystemNameEnum.EMBEDDING] as const;

interface UseLlmCategorizationReturnInterface {
    readonly status: CategorizationStatus;
    readonly transactions: AITransactionInterface[];
    readonly error: string | null;
    readonly categorize: (text: string) => Promise<AITransactionInterface[]>;
    readonly reset: () => void;
}

const suggestCategoryFor = (description: string, categories: CategoryEntityInterface[]) =>
    isNotEmptyArray(categories)
        ? Effect.flatMap(EmbeddingSuggestionService, embeddingSuggestionService =>
              Effect.map(
                  embeddingSuggestionService.suggestCategories(categories, description, null, description, '', null),
                  suggestions => suggestions[0] ?? null
              )
          )
        : Effect.succeed(null);

const extractAndMapTransactions = Effect.fn('useLlmCategorization.extractAndMapTransactions')(function* (
    text: string,
    accounts: AccountWithInstrumentEntityInterface[],
    categories: CategoryEntityInterface[]
) {
    const voiceLlmService = yield* VoiceLlmService;
    const extracted = yield* voiceLlmService.extractTransactions(text);

    if (!isNotEmptyArray(extracted)) {
        return yield* Effect.die(new Error('Failed to extract transactions from text'));
    }

    return yield* Effect.forEach(
        extracted,
        item =>
            Effect.map(suggestCategoryFor(item.description, categories), (category): AITransactionInterface => ({
                category,
                amount: item.amount,
                currency: item.currency,
                account: findAccountByCurrency(accounts, item.currency),
                type: TransactionTypeEnum.EXPENSE,
                comment: item.description
            })),
        { concurrency: 'unbounded' }
    );
});

export const useLlmCategorization = (): UseLlmCategorizationReturnInterface => {
    const { accounts } = useSearchAccountsSortedQuery();
    const { categories } = useNonSystemCategoriesQuery();
    const [status, setStatus] = useState<CategorizationStatus>('idle');
    const [transactions, setTransactions] = useState<AITransactionInterface[]>([]);
    const [error, setError] = useState<string | null>(null);

    const categorize = (text: string): Promise<AITransactionInterface[]> => {
        setStatus('processing');
        setError(null);
        setTransactions([]);

        return appRuntime.runPromise(
            Effect.flatMap(AiModelResidencyService, aiModelResidencyService =>
                Effect.acquireUseRelease(
                    Effect.forEach(VOICE_SUBSYSTEMS, subsystem => aiModelResidencyService.acquire(subsystem), { concurrency: 'unbounded' }),
                    () => extractAndMapTransactions(text, accounts, categories),
                    () => Effect.forEach(VOICE_SUBSYSTEMS, subsystem => aiModelResidencyService.release(subsystem), { discard: true })
                )
            ).pipe(
                Effect.tap(results =>
                    Effect.sync(() => {
                        setTransactions(results);
                        setStatus('done');
                    })
                ),
                Effect.tapCause(cause =>
                    Effect.sync(() => {
                        setError(getRootErrorMessage(Cause.squash(cause)));
                        setStatus('error');
                    })
                )
            )
        );
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
