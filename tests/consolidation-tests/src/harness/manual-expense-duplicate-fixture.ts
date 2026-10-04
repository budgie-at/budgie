import { AccountTypeEnum, PRECISION } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { testSeedService } from './test-context';

import type { ManualExpenseDuplicateAccountsInterface } from './interface/manual-expense-duplicate-accounts.interface';
import type { ManualExpenseDuplicatePairInputInterface } from './interface/manual-expense-duplicate-pair-input.interface';

const MANUAL_EXPENSE_DUPLICATE_BASE_OPERATED_AT_MS = new Date('2025-11-02T10:00:00Z').getTime();
const MANUAL_EXPENSE_DUPLICATE_PAIR_SPACING_MS = 7 * 24 * 60 * 60 * 1000;

export const MANUAL_EXPENSE_DUPLICATE_TIME_WINDOW_SECONDS = 2 * 24 * 60 * 60;

export const seedManualExpenseDuplicateAccounts = Effect.fnUntraced(function* (
    manualAccountType: AccountTypeEnum = AccountTypeEnum.BANK,
    manualInstrumentId = 1
) {
    return {
        syncedAccount: yield* testSeedService.account({ title: 'Privat card', type: AccountTypeEnum.BANK_SYNC, externalId: 'privat-card' }),
        manualAccount: yield* testSeedService.account({ title: 'Privat manual', type: manualAccountType, instrumentId: manualInstrumentId })
    } satisfies ManualExpenseDuplicateAccountsInterface;
});

const buildManualExpenseDuplicateOperatedAt = (index: number): Date =>
    new Date(MANUAL_EXPENSE_DUPLICATE_BASE_OPERATED_AT_MS + index * MANUAL_EXPENSE_DUPLICATE_PAIR_SPACING_MS);

export const buildManualExpenseDuplicateAmount = (index: number): number => (100 + index) * PRECISION;

export const seedManualExpenseDuplicatePair = Effect.fnUntraced(function* (input: ManualExpenseDuplicatePairInputInterface) {
    const operatedAt = buildManualExpenseDuplicateOperatedAt(input.index);
    const amount = buildManualExpenseDuplicateAmount(input.index);
    const synced = yield* testSeedService.bankPairExpense(
        { externalId: `manual-duplicate-synced-${input.index}`, operatedAt },
        { accountId: input.accounts.syncedAccount.id, amount }
    );
    const manual = yield* testSeedService.manualExpense({
        accountId: input.accounts.manualAccount.id,
        amount: amount + (input.manualAmountDelta ?? 0),
        operatedAt: new Date(operatedAt.getTime() + (input.manualOperatedAtOffsetSeconds ?? 0) * 1000),
        categoryId: input.manualCategoryId ?? null,
        comment: input.manualComment ?? '',
        ...(input.manualExternalSource && {
            externalId: `manual-duplicate-imported-${input.index}`,
            externalSource: input.manualExternalSource
        })
    });

    return { synced, manual };
});

export const seedManualExpenseDuplicatePairs = (accounts: ManualExpenseDuplicateAccountsInterface, indexes: readonly number[]) =>
    Effect.forEach(indexes, index => seedManualExpenseDuplicatePair({ accounts, index }));
