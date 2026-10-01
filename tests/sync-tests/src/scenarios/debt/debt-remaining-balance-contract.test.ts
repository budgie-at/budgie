import { convertFromMicroUnits } from '@app/@generic/utils/convert-from-micro-units.util';
import { convertToMicroUnits } from '@app/@generic/utils/convert-to-micro-units.util';
import { AccountDebtOpeningService } from '@app/account/service/account-debt-opening.service';
import { TransactionDebtSettlementService } from '@app/transaction/service/transaction-debt-settlement.service';
import {
    AccountBalanceRepository,
    AccountDebtTypeEnum,
    AccountTypeEnum,
    CurrencyEnum,
    DebtEventDirectionEnum,
    DebtEventEntityTable,
    DebtEventSourceEnum,
    ExternalSourceEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { fetchDebtProgress, TestLayer, upsertCurrencyRate } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

import type { DebtProgressContractInterface } from './interface/debt-progress-contract.interface';
import type { TransactionCreateEntityInterface, TransactionEntryCreateEntityInterface } from '@budgie/contracts';

const OPERATED_AT = new Date('2026-06-02T12:00:00.000Z');

const seedDebtAccount = (debtType: AccountDebtTypeEnum, targetBalance: number, instrumentId = 1) =>
    Effect.gen(function* () {
        return yield* seed.account({ title: 'Debt contract account', type: AccountTypeEnum.DEBT, debtType, targetBalance, instrumentId });
    });

const insertDebtEvent = (debtAccountId: number, direction: DebtEventDirectionEnum, amount: number) =>
    Effect.gen(function* () {
        return yield* insertOne(DebtEventEntityTable, {
            debtAccountId,
            direction,
            source: DebtEventSourceEnum.MANUAL,
            amount,
            operatedAt: OPERATED_AT
        });
    });

const seedPartiallySettledDebt = (debtType: AccountDebtTypeEnum, instrumentId = 1) =>
    Effect.gen(function* () {
        const account = yield* seedDebtAccount(debtType, convertToMicroUnits(1_000), instrumentId);
        yield* insertDebtEvent(account.id, DebtEventDirectionEnum.OPEN, convertToMicroUnits(1_000));
        yield* insertDebtEvent(account.id, DebtEventDirectionEnum.CLOSE, convertToMicroUnits(250));

        return account;
    });

const readHomeRow = Effect.fnUntraced(function* (accountId: number, defaultInstrumentId: number) {
    const accountBalanceRepository = yield* AccountBalanceRepository;
    const row = (yield* accountBalanceRepository.getHomeAccountRows(defaultInstrumentId)).find(homeRow => homeRow.account.id === accountId);

    if (!isDefined(row)) {
        throw new Error(`No home account row for account ${accountId}`);
    }

    return row;
});

const updateDebtEventAmount = (debtEventId: number, amount: number) =>
    Effect.gen(function* () {
        yield* testDb.update(DebtEventEntityTable).set({ amount }).where(eq(DebtEventEntityTable.id, debtEventId));
    });

const softDeleteDebtEvent = (debtEventId: number) =>
    Effect.gen(function* () {
        yield* testDb.update(DebtEventEntityTable).set({ deletedAt: new Date() }).where(eq(DebtEventEntityTable.id, debtEventId));
    });

const sumConvertedOutstandingByDebtType = Effect.fnUntraced(function* (defaultInstrumentId: number, debtType: AccountDebtTypeEnum) {
    const accountBalanceRepository = yield* AccountBalanceRepository;

    return (yield* accountBalanceRepository.getHomeAccountRows(defaultInstrumentId))
        .filter(row => row.account.type === AccountTypeEnum.DEBT && row.account.isActive && row.account.debtType === debtType)
        .reduce((total, row) => total + convertFromMicroUnits(row.convertedDebtOutstandingAmount), 0);
});

const findCloseDebtEvent = (accountId: number) =>
    Effect.gen(function* () {
        const settlement = (yield* testDb.select().from(DebtEventEntityTable)).find(
            event => event.debtAccountId === accountId && event.direction === DebtEventDirectionEnum.CLOSE
        );

        if (!isDefined(settlement)) {
            throw new Error(`Expected a seeded settlement debt event for account ${accountId}`);
        }

        return settlement;
    });

const expectDebtProgressContract = Effect.fnUntraced(function* (accountId: number, expected: DebtProgressContractInterface) {
    const progress = yield* fetchDebtProgress(accountId);

    expect(convertFromMicroUnits(progress.outstandingAmount)).toBe(expected.outstandingAmount);
    expect(convertFromMicroUnits(progress.overpaidAmount)).toBe(expected.overpaidAmount ?? 0);
    expect(convertFromMicroUnits(progress.paidAmount)).toBe(expected.paidAmount);
    expect(convertFromMicroUnits(progress.totalAmount)).toBe(expected.totalAmount);
    expect(progress.percentage).toBe(expected.percentage);
});

describe.each([AccountDebtTypeEnum.LENT, AccountDebtTypeEnum.BORROW])('debt remaining balance contract - %s', debtType => {
    it.effect('reports outstanding/paid/total/percentage for a partial settlement', () =>
        Effect.gen(function* () {
            const account = yield* seedPartiallySettledDebt(debtType);

            yield* expectDebtProgressContract(account.id, { outstandingAmount: 750, paidAmount: 250, totalAmount: 1_000, percentage: 25 });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('reports the same partial-settlement contract when opened and repaid through the v2 funding-account flow', () =>
        Effect.gen(function* () {
            const accountDebtOpeningService = yield* AccountDebtOpeningService;
            const transactionDebtSettlementService = yield* TransactionDebtSettlementService;

            const fundingAccount = yield* seed.account({ title: 'Funding account', type: AccountTypeEnum.BANK_SYNC });
            const debtAccount = yield* accountDebtOpeningService.openDebtWithFundingAccount(
                {
                    title: debtType === AccountDebtTypeEnum.LENT ? 'Alex owes me' : 'I owe Alex',
                    iban: null,
                    icon: UserIconNameEnum.HandCoins,
                    instrumentId: fundingAccount.instrumentId,
                    type: AccountTypeEnum.DEBT,
                    debtType,
                    currentBalance: 0,
                    targetBalance: 1_000,
                    contactId: null,
                    deadline: null
                },
                fundingAccount.id
            );
            const repaymentType = debtType === AccountDebtTypeEnum.LENT ? TransactionTypeEnum.INCOME : TransactionTypeEnum.EXPENSE;
            const isRepaymentExpense = repaymentType === TransactionTypeEnum.EXPENSE;
            const repayment = yield* insertOne(TransactionEntityTable, {
                type: repaymentType,
                title: 'Repayment',
                externalId: null,
                externalSource: ExternalSourceEnum.MONOBANK,
                operatedAt: OPERATED_AT,
                comment: '',
                exchangeRate: 1,
                updatedBy: null,
                fromAccountId: isRepaymentExpense ? fundingAccount.id : null,
                toAccountId: isRepaymentExpense ? null : fundingAccount.id
            } satisfies TransactionCreateEntityInterface);

            yield* insertOne(TransactionEntryEntityTable, {
                transactionId: repayment.id,
                accountId: fundingAccount.id,
                type: isRepaymentExpense ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT,
                kind: TransactionEntryKindEnum.PRIMARY,
                amount: convertToMicroUnits(250),
                categoryId: null,
                mccCategoryId: null,
                externalId: null,
                exchangeRate: 1,
                baseInstrumentId: 1,
                baseExchangeRate: 1,
                baseAmount: convertToMicroUnits(250),
                toIban: null,
                originalTransactionId: null
            } satisfies TransactionEntryCreateEntityInterface);

            yield* transactionDebtSettlementService.attach({ transactionId: repayment.id, debtAccountId: debtAccount.id });

            yield* expectDebtProgressContract(debtAccount.id, {
                outstandingAmount: 750,
                paidAmount: 250,
                totalAmount: 1_000,
                percentage: 25
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('sums the section total in the default instrument when the debt is already in the default currency', () =>
        Effect.gen(function* () {
            const account = yield* seedPartiallySettledDebt(debtType);
            const row = yield* readHomeRow(account.id, account.instrumentId);
            const sectionTotal = yield* sumConvertedOutstandingByDebtType(account.instrumentId, debtType);

            expect(row.debtOutstandingAmount).toBe(convertToMicroUnits(750));
            expect(convertFromMicroUnits(row.convertedDebtOutstandingAmount)).toBe(750);
            expect(sectionTotal).toBe(750);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('converts the outstanding amount using the seeded exchange rate while keeping the unconverted amount stable', () =>
        Effect.gen(function* () {
            const exchangeRate = 0.7;
            const { baseInstrument: usdInstrument, quoteInstrument: eurInstrument } = yield* upsertCurrencyRate(
                CurrencyEnum.USD,
                CurrencyEnum.EUR,
                exchangeRate
            );

            const account = yield* seedPartiallySettledDebt(debtType, usdInstrument.id);
            const row = yield* readHomeRow(account.id, eurInstrument.id);
            const sectionTotal = yield* sumConvertedOutstandingByDebtType(eurInstrument.id, debtType);

            expect(row.debtOutstandingAmount).toBe(convertToMicroUnits(750));
            expect(convertFromMicroUnits(row.convertedDebtOutstandingAmount)).toBeCloseTo(750 * exchangeRate, 5);
            expect(sectionTotal).toBeCloseTo(750 * exchangeRate, 5);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('recomputes outstanding/paid after the settlement amount is edited', () =>
        Effect.gen(function* () {
            const account = yield* seedPartiallySettledDebt(debtType);
            const settlement = yield* findCloseDebtEvent(account.id);

            yield* updateDebtEventAmount(settlement.id, convertToMicroUnits(400));

            yield* expectDebtProgressContract(account.id, { outstandingAmount: 600, paidAmount: 400, totalAmount: 1_000, percentage: 40 });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not shrink the total when the settlement is soft-deleted', () =>
        Effect.gen(function* () {
            const account = yield* seedPartiallySettledDebt(debtType);
            const settlement = yield* findCloseDebtEvent(account.id);

            yield* softDeleteDebtEvent(settlement.id);

            yield* expectDebtProgressContract(account.id, { outstandingAmount: 1_000, paidAmount: 0, totalAmount: 1_000, percentage: 0 });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('reports a zero-total account without NaN', () =>
        Effect.gen(function* () {
            const account = yield* seedDebtAccount(debtType, 0);

            yield* expectDebtProgressContract(account.id, { outstandingAmount: 0, paidAmount: 0, totalAmount: 0, percentage: 0 });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('reports the target amount as fully outstanding before any debt events exist', () =>
        Effect.gen(function* () {
            const account = yield* seedDebtAccount(debtType, convertToMicroUnits(13_000));

            yield* expectDebtProgressContract(account.id, { outstandingAmount: 13_000, paidAmount: 0, totalAmount: 13_000, percentage: 0 });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the total at the principal and reports the excess as overpaid', () =>
        Effect.gen(function* () {
            const account = yield* seedDebtAccount(debtType, convertToMicroUnits(1_000));
            yield* insertDebtEvent(account.id, DebtEventDirectionEnum.OPEN, convertToMicroUnits(1_000));
            yield* insertDebtEvent(account.id, DebtEventDirectionEnum.CLOSE, convertToMicroUnits(1_200));

            yield* expectDebtProgressContract(account.id, {
                outstandingAmount: 0,
                overpaidAmount: 200,
                paidAmount: 1_200,
                totalAmount: 1_000,
                percentage: 100
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('grows the total when more is lent or borrowed after the opening amount', () =>
        Effect.gen(function* () {
            const account = yield* seedPartiallySettledDebt(debtType);
            yield* insertDebtEvent(account.id, DebtEventDirectionEnum.OPEN, convertToMicroUnits(500));

            yield* expectDebtProgressContract(account.id, {
                outstandingAmount: 1_250,
                paidAmount: 250,
                totalAmount: 1_500,
                percentage: 16.67
            });
        }).pipe(Effect.provide(TestLayer))
    );
});
