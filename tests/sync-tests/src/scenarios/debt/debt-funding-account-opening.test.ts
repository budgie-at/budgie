import { AccountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';
import { AccountDebtOpeningService } from '@app/account/service/account-debt-opening.service';
import {
    AccountDebtTypeEnum,
    AccountTypeEnum,
    BORROWING_CATEGORY_ID,
    CategorySourceEnum,
    CurrencyEnum,
    DebtEventDirectionEnum,
    DebtEventEntityTable,
    DebtEventSourceEnum,
    LENDING_CATEGORY_ID,
    PRECISION,
    TransactionEntryEntityTable,
    TransactionEntityTable,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance, TestLayer, upsertCurrencyRate } from '../../harness';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

import type { AccountEntityInterface } from '@budgie/contracts';

const OPENING_AMOUNT = 500;

const openDebt = Effect.fnUntraced(function* (
    debtType: AccountDebtTypeEnum,
    fundingAccount: AccountEntityInterface,
    instrumentId?: number
) {
    const accountDebtOpeningService = yield* AccountDebtOpeningService;

    return yield* accountDebtOpeningService.openDebtWithFundingAccount(
        {
            title: debtType === AccountDebtTypeEnum.LENT ? 'Alex owes me' : 'I owe Alex',
            iban: null,
            icon: UserIconNameEnum.HandCoins,
            instrumentId: instrumentId ?? fundingAccount.instrumentId,
            type: AccountTypeEnum.DEBT,
            debtType,
            currentBalance: 0,
            targetBalance: OPENING_AMOUNT,
            contactId: null,
            deadline: null
        },
        fundingAccount.id
    );
});

const readEntries = (accountId: number) =>
    Effect.gen(function* () {
        return yield* testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.accountId, accountId));
    });

const readDebtEvents = (debtAccountId: number) =>
    Effect.gen(function* () {
        return yield* testDb.select().from(DebtEventEntityTable).where(eq(DebtEventEntityTable.debtAccountId, debtAccountId));
    });

describe('opening a debt from a funding account', () => {
    it.effect.each([
        {
            debtType: AccountDebtTypeEnum.LENT,
            transactionType: TransactionTypeEnum.EXPENSE,
            categoryId: LENDING_CATEGORY_ID,
            expectedDebtBalance: OPENING_AMOUNT * PRECISION
        },
        {
            debtType: AccountDebtTypeEnum.BORROW,
            transactionType: TransactionTypeEnum.INCOME,
            categoryId: BORROWING_CATEGORY_ID,
            expectedDebtBalance: -OPENING_AMOUNT * PRECISION
        }
    ])('books a single $debtType movement on the funding account', ({ debtType, transactionType, categoryId, expectedDebtBalance }) =>
        Effect.gen(function* () {
            const fundingAccount = yield* seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
            const debtAccount = yield* openDebt(debtType, fundingAccount);
            const [entry] = yield* readEntries(fundingAccount.id);
            const [transaction] = yield* testDb
                .select()
                .from(TransactionEntityTable)
                .where(eq(TransactionEntityTable.id, entry.transactionId));
            const debtEvents = yield* readDebtEvents(debtAccount.id);

            expect(yield* readEntries(fundingAccount.id)).toHaveLength(1);
            expect(transaction?.type).toBe(transactionType);
            expect(entry.categoryId).toBe(categoryId);
            expect(entry.categorySource).toBe(CategorySourceEnum.DEBT_SETTLEMENT);
            expect(entry.amount).toBe(OPENING_AMOUNT * PRECISION);
            expect(yield* readEntries(debtAccount.id)).toHaveLength(0);
            expect(debtEvents).toHaveLength(1);
            expect(debtEvents[0]).toMatchObject({
                direction: DebtEventDirectionEnum.OPEN,
                source: DebtEventSourceEnum.OPENING,
                amount: OPENING_AMOUNT * PRECISION,
                transactionEntryId: entry.id
            });
            expect(yield* fetchAccountBalance(debtAccount.id)).toBe(expectedDebtBalance);
            expect(yield* fetchAccountBalance(fundingAccount.id)).toBe(-expectedDebtBalance);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the entered target in the debt instrument and converts only the funding entry', () =>
        Effect.gen(function* () {
            const { baseInstrument: eurInstrument, quoteInstrument: usdInstrument } = yield* upsertCurrencyRate(
                CurrencyEnum.EUR,
                CurrencyEnum.USD,
                2
            );

            const fundingAccount = yield* seed.account({
                title: 'Euro account',
                type: AccountTypeEnum.BANK_SYNC,
                instrumentId: eurInstrument.id
            });
            const debtAccount = yield* openDebt(AccountDebtTypeEnum.LENT, fundingAccount, usdInstrument.id);
            const [entry] = yield* readEntries(fundingAccount.id);

            expect(entry.amount).toBe((OPENING_AMOUNT / 2) * PRECISION);
            expect(debtAccount.targetBalance).toBe(OPENING_AMOUNT * PRECISION);
            expect((yield* readDebtEvents(debtAccount.id))[0].amount).toBe(OPENING_AMOUNT * PRECISION);
            expect(yield* fetchAccountBalance(debtAccount.id)).toBe(OPENING_AMOUNT * PRECISION);
            expect(yield* fetchAccountBalance(fundingAccount.id)).toBe(-(OPENING_AMOUNT / 2) * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('recomputes the debt ledger balance from events when all balances are truncated', () =>
        Effect.gen(function* () {
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;

            const fundingAccount = yield* seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
            const debtAccount = yield* openDebt(AccountDebtTypeEnum.BORROW, fundingAccount);

            yield* accountBalanceIncrementalService.updateAllBalances(true);

            expect(yield* fetchAccountBalance(debtAccount.id)).toBe(-OPENING_AMOUNT * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );
});
