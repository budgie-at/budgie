import {
    AccountBalanceRepository,
    AccountTypeEnum,
    DEFAULT_TRANSACTION_FILTER,
    ExternalSourceEnum,
    PRECISION,
    StatisticsRepository,
    TransactionConsolidationTypeEnum,
    TransactionEntryEntityTable,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum
} from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { getDefined } from '@rnw-community/shared';

import {
    P2P_BANK_AMOUNT,
    P2P_OPERATED_AT,
    P2P_SPLIT_BANK_EXTRA_AMOUNT,
    P2P_SPLIT_BANK_PRIMARY_AMOUNT,
    seedP2pAccount,
    seedP2pBankBuyExpense,
    seedP2pBuy,
    seedP2pFiatInstrument
} from '../harness/p2p-fiat-transfer-fixture';
import { runConsolidation } from '../harness/run-consolidation';
import { testDb, testQueryService, testSeedService, TestLayer } from '../harness/test-context';

import type { TransactionEntryCreateEntityInterface, TransactionEntryEntityInterface } from '@budgie/contracts';

const BANK_FEE_AMOUNT = 50 * PRECISION;

const seedFeeEntry = (transactionId: number, accountId: number): void => {
    testDb
        .insert(TransactionEntryEntityTable)
        .values({
            transactionId,
            accountId,
            type: TransactionEntryTypeEnum.FEE,
            amount: BANK_FEE_AMOUNT,
            externalId: 'mono-p2p-bank-fee',
            exchangeRate: 1,
            baseInstrumentId: 1,
            baseExchangeRate: 1,
            baseAmount: BANK_FEE_AMOUNT,
            toIban: null,
            categoryId: null,
            mccCategoryId: null,
            originalTransactionId: null
        } satisfies TransactionEntryCreateEntityInterface)
        .run();
};

const fetchBankBalance = Effect.fnUntraced(function* (accountId: number) {
    const accountBalanceRepository = yield* AccountBalanceRepository;

    return getDefined((yield* accountBalanceRepository.getByAccountId(accountId)).at(0), () => {
        throw new Error('Failed to fetch bank account balance');
    }).balance;
});

const fetchTotalExpense = Effect.fnUntraced(function* () {
    const statisticsRepository = yield* StatisticsRepository;

    return getDefined((yield* statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, 1)).at(0), () => {
        throw new Error('Failed to fetch total statistics');
    }).expense;
});

const seedP2pBuyWithFee = (accountTitle: string) => {
    const bankAccount = testSeedService.bankSyncAccount(accountTitle, ExternalSourceEnum.MONOBANK, null);
    const bankExpense = seedP2pBankBuyExpense(bankAccount.id);

    seedFeeEntry(bankExpense.id, bankAccount.id);
    seedP2pBuy(bankAccount);

    return { bankAccount, bankExpense };
};

const runScopedBankRepair = (bankExpenseId: number) =>
    runConsolidation({
        operatedAtFrom: new Date(P2P_OPERATED_AT.getTime() - 60_000),
        operatedAtTo: new Date(P2P_OPERATED_AT.getTime() + 60_000),
        transactionIds: [bankExpenseId]
    });

const expectLiveCanonicalFeeEntry = (entries: TransactionEntryEntityInterface[]): void => {
    expect(entries.filter(entry => entry.type === TransactionEntryTypeEnum.FEE && entry.originalTransactionId === null)).toHaveLength(1);
};

const expectFeeAggregates = Effect.fnUntraced(function* (bankAccountId: number) {
    expect(yield* fetchBankBalance(bankAccountId)).toBe(-(P2P_BANK_AMOUNT + BANK_FEE_AMOUNT));
    expect(yield* fetchTotalExpense()).toBe(BANK_FEE_AMOUNT);
});

layer(TestLayer)('consolidation/p2p-fiat-transfer fee handling', it => {
    it.effect('preserves fee rows while matching the primary bank expense entry', () =>
        Effect.gen(function* () {
            const { bankAccount, bankExpense } = seedP2pBuyWithFee('Monobank P2P');

            const result = yield* runConsolidation();
            const [canonical] = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER);

            expect(result.consolidated).toBe(1);
            expectLiveCanonicalFeeEntry(testQueryService.fetchEntriesByTransactionId(canonical.id));
            expect(
                testQueryService.fetchEntriesByTransactionId(canonical.id).filter(entry => entry.originalTransactionId === bankExpense.id)
            ).toHaveLength(2);
            yield* expectFeeAggregates(bankAccount.id);

            const repairResult = yield* runScopedBankRepair(bankExpense.id);
            const [repairedCanonical] = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER);

            expect(repairResult.consolidated).toBe(0);
            expectLiveCanonicalFeeEntry(testQueryService.fetchEntriesByTransactionId(repairedCanonical.id));
        })
    );

    it.effect('ignores non-primary bank entries when checking scoped P2P repair candidates', () =>
        Effect.gen(function* () {
            const { bankAccount, bankExpense } = seedP2pBuyWithFee('Monobank P2P repair');

            const result = yield* runConsolidation();
            const [canonical] = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER);

            testDb
                .insert(TransactionEntryEntityTable)
                .values({
                    transactionId: canonical.id,
                    accountId: bankAccount.id,
                    type: TransactionEntryTypeEnum.CREDIT,
                    kind: TransactionEntryKindEnum.DEBT_SETTLEMENT,
                    amount: 1,
                    externalId: 'mono-p2p-repair-non-primary-bank-entry',
                    exchangeRate: 1,
                    baseInstrumentId: 1,
                    baseExchangeRate: 1,
                    baseAmount: 1,
                    toIban: null,
                    categoryId: null,
                    mccCategoryId: null,
                    originalTransactionId: bankExpense.id
                } satisfies TransactionEntryCreateEntityInterface)
                .run();

            const repairResult = yield* runScopedBankRepair(bankExpense.id);

            expect(result.consolidated).toBe(1);
            expect(repairResult.consolidated).toBe(0);
        })
    );
});

layer(TestLayer)('consolidation/p2p-fiat-transfer bank candidate constraints', it => {
    it.effect('rejects buy combinations that reuse the same bank transaction id', () =>
        Effect.gen(function* () {
            const bankAccount = testSeedService.bankSyncAccount('Monobank split entry P2P', ExternalSourceEnum.MONOBANK, null);
            const bankExpense = testSeedService.bankPairExpense(
                { externalId: 'mono-p2p-split-expense', operatedAt: P2P_OPERATED_AT },
                { accountId: bankAccount.id, amount: P2P_SPLIT_BANK_PRIMARY_AMOUNT }
            );

            testDb
                .insert(TransactionEntryEntityTable)
                .values({
                    transactionId: bankExpense.id,
                    accountId: bankAccount.id,
                    type: TransactionEntryTypeEnum.CREDIT,
                    amount: P2P_SPLIT_BANK_EXTRA_AMOUNT,
                    externalId: 'mono-p2p-split-expense-extra',
                    exchangeRate: 1,
                    baseInstrumentId: 1,
                    baseExchangeRate: 1,
                    baseAmount: P2P_SPLIT_BANK_EXTRA_AMOUNT,
                    toIban: null,
                    categoryId: null,
                    mccCategoryId: null,
                    originalTransactionId: null
                } satisfies TransactionEntryCreateEntityInterface)
                .run();
            seedP2pBuy(bankAccount);

            const result = yield* runConsolidation();

            expect(result.consolidated).toBe(0);
            expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(0);
        })
    );

    it.effect.each([AccountTypeEnum.CASH, AccountTypeEnum.DEBT, AccountTypeEnum.STOCKS, AccountTypeEnum.CRYPTO])(
        'does not match a P2P buy against %s accounts',
        accountType =>
            Effect.gen(function* () {
                const instrument =
                    accountType === AccountTypeEnum.STOCKS ? testSeedService.instrument(seedP2pFiatInstrument('AAPL')) : null;
                const account = seedP2pAccount(accountType, instrument?.id ?? 1);

                seedP2pBankBuyExpense(account.id);
                seedP2pBuy(account);

                const result = yield* runConsolidation();

                expect(result.consolidated).toBe(0);
                expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(0);
            })
    );
});
