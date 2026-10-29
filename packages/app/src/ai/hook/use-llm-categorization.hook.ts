import { AITransactionInterface, VoiceLlmService, findAccountByCurrency } from '@budgie/ai';
import { EmbeddingSuggestionService } from '@budgie/categorization';
import { AccountWithInstrumentEntityInterface, CategoryEntityInterface, TransactionTypeEnum } from '@budgie/contracts';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import { useReducer } from 'react';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useSearchAccountsSortedQuery } from '../../account/query/use-search-accounts-sorted.query';
import { useNonSystemCategoriesQuery } from '../../category/query/use-non-system-categories.query';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { LlmCategorizationActionTypeEnum } from '../enum/llm-categorization-action-type.enum';
import { VoiceInputStateEnum } from '../enum/voice-input-state.enum';
import { LlmCategorizationActionInterface } from '../interface/llm-categorization-action.interface';
import { LlmCategorizationStateInterface } from '../interface/llm-categorization-state.interface';
import { AiModelResidencyService } from '../service/ai-model-residency.service';
import { getRootErrorMessage } from '../utils/get-root-error-message.util';

import type { AppServices } from '../../@generic/runtime/app.runtime';

const VOICE_SUBSYSTEMS = [AiSubsystemNameEnum.CHAT, AiSubsystemNameEnum.EMBEDDING] as const;

interface UseLlmCategorizationReturnInterface {
    readonly status: VoiceInputStateEnum;
    readonly transactions: AITransactionInterface[];
    readonly error: string | null;
    readonly categorize: (text: string) => Effect.Effect<AITransactionInterface[], unknown, AppServices>;
    readonly reset: () => void;
}

const INITIAL_STATE: LlmCategorizationStateInterface = { status: VoiceInputStateEnum.IDLE, transactions: [], error: null };

const reducer = (state: LlmCategorizationStateInterface, action: LlmCategorizationActionInterface): LlmCategorizationStateInterface => {
    if (action.type === LlmCategorizationActionTypeEnum.CATEGORIZATION_STARTED) {
        return { status: VoiceInputStateEnum.PROCESSING, transactions: [], error: null };
    }
    if (action.type === LlmCategorizationActionTypeEnum.CATEGORIZATION_SUCCEEDED) {
        return { ...state, status: VoiceInputStateEnum.DONE, transactions: action.transactions };
    }
    if (action.type === LlmCategorizationActionTypeEnum.CATEGORIZATION_FAILED) {
        return { ...state, status: VoiceInputStateEnum.ERROR, error: action.error };
    }

    return INITIAL_STATE;
};

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
    const [{ status, transactions, error }, dispatch] = useReducer(reducer, INITIAL_STATE);

    const categorize = (text: string) =>
        Effect.sync(() => void dispatch({ type: LlmCategorizationActionTypeEnum.CATEGORIZATION_STARTED })).pipe(
            Effect.andThen(
                Effect.flatMap(AiModelResidencyService, aiModelResidencyService =>
                    Effect.acquireUseRelease(
                        Effect.forEach(VOICE_SUBSYSTEMS, subsystem => aiModelResidencyService.acquire(subsystem), {
                            concurrency: 'unbounded'
                        }),
                        () => extractAndMapTransactions(text, accounts, categories),
                        () => Effect.forEach(VOICE_SUBSYSTEMS, subsystem => aiModelResidencyService.release(subsystem), { discard: true })
                    )
                )
            ),
            Effect.tap(results =>
                Effect.sync(() => void dispatch({ type: LlmCategorizationActionTypeEnum.CATEGORIZATION_SUCCEEDED, transactions: results }))
            ),
            Effect.tapCause(cause =>
                Effect.sync(
                    () =>
                        void dispatch({
                            type: LlmCategorizationActionTypeEnum.CATEGORIZATION_FAILED,
                            error: getRootErrorMessage(Cause.squash(cause))
                        })
                )
            )
        );

    const reset = (): void => {
        dispatch({ type: LlmCategorizationActionTypeEnum.RESET });
    };

    return {
        status,
        transactions,
        error,
        categorize,
        reset
    };
};
