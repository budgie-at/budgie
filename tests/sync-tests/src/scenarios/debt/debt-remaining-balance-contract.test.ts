import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { convertFromMicroUnits } from '@app/@generic/utils/convert-from-micro-units.util';
import { convertToMicroUnits } from '@app/@generic/utils/convert-to-micro-units.util';
import { AccountDebtOpeningService } from '@app/account/service/account-debt-opening.service';
import { TransactionDebtSettlementService } from '@app/transaction/service/transaction-debt-settlement.service';
import { buildTestDb, makeTestPlatformLayer } from '@budgie-at/test-kit';
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
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { fetchDebtProgress, TestLayer, upsertCurrencyRate } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

import { LegacyDebtContractFixture } from './legacy-debt-contract-fixture';

import type { DebtProgressContractInterface } from './interface/debt-progress-contract.interface';
import type {
    AccountEntityInterface,
    DebtEventEntityInterface,
    TransactionCreateEntityInterface,
    TransactionEntryCreateEntityInterface
} from '@budgie/contracts';

const OPERATED_AT = new Date('2026-06-02T12:00:00.000Z');
const scenarioDirectory = resolve(fileURLToPath(import.meta.url), '..');
const preMigrationFixturePath = resolve(scenarioDirectory, '../../../fixtures/debt-migration/pre-0033.db');

const seedDebtAccount = (debtType: AccountDebtTypeEnum, targetBalance: number, instrumentId = 1): AccountEntityInterface =>
    seed.account({ title: 'Debt contract account', type: AccountTypeEnum.DEBT, debtType, targetBalance, instrumentId });

const insertDebtEvent = (debtAccountId: number, direction: DebtEventDirectionEnum, amount: number): DebtEventEntityInterface =>
    insertOne(DebtEventEntityTable, {
        debtAccountId,
        direction,
        source: DebtEventSourceEnum.MANUAL,
        amount,
        operatedAt: OPERATED_AT
    });

const seedPartiallySettledDebt = (debtType: AccountDebtTypeEnum, instrumentId = 1): AccountEntityInterface => {
    const account = seedDebtAccount(debtType, convertToMicroUnits(1_000), instrumentId);
    insertDebtEvent(account.id, DebtEventDirectionEnum.OPEN, convertToMicroUnits(1_000));
    insertDebtEvent(account.id, DebtEventDirectionEnum.CLOSE, convertToMicroUnits(250));

    return account;
};

const readHomeRow = Effect.fnUntraced(function* (accountId: number, defaultInstrumentId: number) {
    const accountBalanceRepository = yield* AccountBalanceRepository;
    const row = (yield* accountBalanceRepository.getHomeAccountRows(defaultInstrumentId)).find(homeRow => homeRow.account.id === accountId);

    if (!isDefined(row)) {
        throw new Error(`No home account row for account ${accountId}`);
    }

    return row;
});

const updateDebtEventAmount = (debtEventId: number, amount: number): void => {
    testDb.update(DebtEventEntityTable).set({ amount }).where(eq(DebtEventEntityTable.id, debtEventId)).run();
};

const softDeleteDebtEvent = (debtEventId: number): void => {
    testDb.update(DebtEventEntityTable).set({ deletedAt: new Date() }).where(eq(DebtEventEntityTable.id, debtEventId)).run();
};

const sumConvertedOutstandingByDebtType = Effect.fnUntraced(function* (defaultInstrumentId: number, debtType: AccountDebtTypeEnum) {
    const accountBalanceRepository = yield* AccountBalanceRepository;

    return (yield* accountBalanceRepository.getHomeAccountRows(defaultInstrumentId))
        .filter(row => row.account.type === AccountTypeEnum.DEBT && row.account.isActive && row.account.debtType === debtType)
        .reduce((total, row) => total + convertFromMicroUnits(row.convertedDebtOutstandingAmount), 0);
});

const findCloseDebtEvent = (accountId: number): DebtEventEntityInterface => {
    const settlement = testDb
        .select()
        .from(DebtEventEntityTable)
        .all()
        .find(event => event.debtAccountId === accountId && event.direction === DebtEventDirectionEnum.CLOSE);

    if (!isDefined(settlement)) {
        throw new Error(`Expected a seeded settlement debt event for account ${accountId}`);
    }

    return settlement;
};

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
            const account = seedPartiallySettledDebt(debtType);

            yield* expectDebtProgressContract(account.id, { outstandingAmount: 750, paidAmount: 250, totalAmount: 1_000, percentage: 25 });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('reports the same partial-settlement contract when opened and repaid through the v2 funding-account flow', () =>
        Effect.gen(function* () {
            const accountDebtOpeningService = yield* AccountDebtOpeningService;
            const transactionDebtSettlementService = yield* TransactionDebtSettlementService;

            const fundingAccount = seed.account({ title: 'Funding account', type: AccountTypeEnum.BANK_SYNC });
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
            const repayment = insertOne(TransactionEntityTable, {
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

            insertOne(TransactionEntryEntityTable, {
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
            const account = seedPartiallySettledDebt(debtType);
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

            const account = seedPartiallySettledDebt(debtType, usdInstrument.id);
            const row = yield* readHomeRow(account.id, eurInstrument.id);
            const sectionTotal = yield* sumConvertedOutstandingByDebtType(eurInstrument.id, debtType);

            expect(row.debtOutstandingAmount).toBe(convertToMicroUnits(750));
            expect(convertFromMicroUnits(row.convertedDebtOutstandingAmount)).toBeCloseTo(750 * exchangeRate, 5);
            expect(sectionTotal).toBeCloseTo(750 * exchangeRate, 5);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('recomputes outstanding/paid after the settlement amount is edited', () =>
        Effect.gen(function* () {
            const account = seedPartiallySettledDebt(debtType);
            const settlement = findCloseDebtEvent(account.id);

            updateDebtEventAmount(settlement.id, convertToMicroUnits(400));

            yield* expectDebtProgressContract(account.id, { outstandingAmount: 600, paidAmount: 400, totalAmount: 1_000, percentage: 40 });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not shrink the total when the settlement is soft-deleted', () =>
        Effect.gen(function* () {
            const account = seedPartiallySettledDebt(debtType);
            const settlement = findCloseDebtEvent(account.id);

            softDeleteDebtEvent(settlement.id);

            yield* expectDebtProgressContract(account.id, { outstandingAmount: 1_000, paidAmount: 0, totalAmount: 1_000, percentage: 0 });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect(
        'reports the same outstanding/paid/total/percentage contract for a legacy opening-balance snapshot after migration backfills debt events',
        () =>
            Effect.gen(function* () {
                const accountId =
                    debtType === AccountDebtTypeEnum.LENT
                        ? LegacyDebtContractFixture.LENT_ACCOUNT_ID
                        : LegacyDebtContractFixture.BORROW_ACCOUNT_ID;
                const fixture = new LegacyDebtContractFixture(preMigrationFixturePath);
                const preparedFixturePath = fixture.prepare();
                yield* Effect.addFinalizer(() =>
                    Effect.sync(() => {
                        fixture.cleanup();
                    })
                );
                const migratedDb = buildTestDb(preparedFixturePath);
                yield* Effect.addFinalizer(() => Effect.promise(() => migratedDb.$client.closeAsync()));

                yield* Effect.gen(function* () {
                    const migratedAccountBalanceRepository = yield* AccountBalanceRepository;
                    const progress = (yield* migratedAccountBalanceRepository.getDebtAccountProgressByAccountId(accountId)).at(0);

                    if (!isDefined(progress)) {
                        throw new Error(`No migrated debt progress row for legacy account ${accountId}`);
                    }

                    expect(convertFromMicroUnits(progress.outstandingAmount)).toBe(750);
                    expect(convertFromMicroUnits(progress.paidAmount)).toBe(250);
                    expect(convertFromMicroUnits(progress.totalAmount)).toBe(1_000);
                    expect(progress.percentage).toBe(25);

                    const homeRow = (yield* migratedAccountBalanceRepository.getHomeAccountRows(1)).find(
                        row => row.account.id === accountId
                    );

                    if (!isDefined(homeRow)) {
                        throw new Error(`No migrated home account row for legacy account ${accountId}`);
                    }

                    expect(convertFromMicroUnits(homeRow.debtOutstandingAmount)).toBe(750);
                }).pipe(Effect.provide(Layer.mergeAll(AccountBalanceRepository.layer, makeTestPlatformLayer(migratedDb))));
            }).pipe(Effect.provide(TestLayer))
    );

    it.effect('reports a zero-total account without NaN', () =>
        Effect.gen(function* () {
            const account = seedDebtAccount(debtType, 0);

            yield* expectDebtProgressContract(account.id, { outstandingAmount: 0, paidAmount: 0, totalAmount: 0, percentage: 0 });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('reports the target amount as fully outstanding before any debt events exist', () =>
        Effect.gen(function* () {
            const account = seedDebtAccount(debtType, convertToMicroUnits(13_000));

            yield* expectDebtProgressContract(account.id, { outstandingAmount: 13_000, paidAmount: 0, totalAmount: 13_000, percentage: 0 });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the total at the principal and reports the excess as overpaid', () =>
        Effect.gen(function* () {
            const account = seedDebtAccount(debtType, convertToMicroUnits(1_000));
            insertDebtEvent(account.id, DebtEventDirectionEnum.OPEN, convertToMicroUnits(1_000));
            insertDebtEvent(account.id, DebtEventDirectionEnum.CLOSE, convertToMicroUnits(1_200));

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
            const account = seedPartiallySettledDebt(debtType);
            insertDebtEvent(account.id, DebtEventDirectionEnum.OPEN, convertToMicroUnits(500));

            yield* expectDebtProgressContract(account.id, {
                outstandingAmount: 1_250,
                paidAmount: 250,
                totalAmount: 1_500,
                percentage: 16.67
            });
        }).pipe(Effect.provide(TestLayer))
    );
});
