import {
    AccountNatureEnum,
    AccountTypeEnum,
    DEFAULT_TRANSACTION_FILTER,
    ExchangeRateEntityTable,
    ExternalSourceEnum,
    InstrumentTypeEnum,
    PRECISION,
    TransactionConsolidationTypeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { getDefined } from '@rnw-community/shared';

import { runConsolidation } from '../harness/run-consolidation';
import { accountBalanceRepository, statisticsRepository, testDb, testQueryService, testSeedService } from '../harness/test-context';

import type {
    AccountEntityInterface,
    InstrumentCreateEntityInterface,
    TransactionCreateEntityInterface,
    TransactionEntryCreateEntityInterface,
    TransactionEntryEntityInterface,
    TransactionEntityInterface
} from '@budgie/contracts';

const OPERATED_AT = new Date('2026-02-20T10:00:00.000Z');
const BANK_FEE_AMOUNT = 50 * PRECISION;
const P2P_ASSET_AMOUNT = 1_000 * PRECISION;
const QUOTED_UNIT_PRICE = 41 * PRECISION;
const BANK_AMOUNT = (QUOTED_UNIT_PRICE * P2P_ASSET_AMOUNT) / PRECISION;
const SPLIT_BANK_PRIMARY_AMOUNT = 20 * P2P_ASSET_AMOUNT;
const SPLIT_BANK_EXTRA_AMOUNT = 21 * P2P_ASSET_AMOUNT;
const P2P_EXTERNAL_ID = 'binance:c2c:order-1';

const seedUsdt = () =>
    testSeedService.instrument({
        code: 'USDT',
        name: 'Tether',
        symbol: 'USDT',
        type: InstrumentTypeEnum.CRYPTO
    });

const seedExchangeRate = (baseInstrumentId: number, quoteInstrumentId: number, rate: number): void => {
    testDb
        .insert(ExchangeRateEntityTable)
        .values({
            baseInstrumentId,
            quoteInstrumentId,
            rate,
            source: 'test'
        })
        .run();
};

const seedFiatInstrument = (code: string): Pick<InstrumentCreateEntityInterface, 'code' | 'name' | 'symbol' | 'type'> => ({
    code,
    name: code,
    symbol: code,
    type: InstrumentTypeEnum.FIAT
});

const seedAccount = (type: AccountTypeEnum, instrumentId: number): AccountEntityInterface =>
    testSeedService.account({
        title: `${type} P2P account`,
        type,
        nature: type === AccountTypeEnum.DEBT ? AccountNatureEnum.LIABILITY : AccountNatureEnum.ASSET,
        instrumentId,
        icon: UserIconNameEnum.Wallet,
        externalId: `${type}-p2p-account`
    });

const seedBankBuyExpense = (accountId: number): TransactionEntityInterface =>
    testSeedService.bankPairExpense({ externalId: 'mono-p2p-bank-expense', operatedAt: OPERATED_AT }, { accountId, amount: BANK_AMOUNT });

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

const seedP2pBuyIncome = (accountId: number, quotedInstrumentId: number): TransactionEntityInterface => {
    const transaction = testDb
        .insert(TransactionEntityTable)
        .values({
            type: TransactionTypeEnum.INCOME,
            title: 'Binance P2P buy USDT',
            externalId: P2P_EXTERNAL_ID,
            externalSource: ExternalSourceEnum.BINANCE,
            operatedAt: new Date(OPERATED_AT.getTime() + 30_000),
            exchangeRate: 1,
            fromAccountId: null,
            toAccountId: accountId,
            comment: '',
            updatedBy: null
        } satisfies TransactionCreateEntityInterface)
        .returning()
        .get();

    testDb
        .insert(TransactionEntryEntityTable)
        .values({
            transactionId: transaction.id,
            accountId,
            type: TransactionEntryTypeEnum.DEBIT,
            amount: P2P_ASSET_AMOUNT,
            externalId: P2P_EXTERNAL_ID,
            exchangeRate: 1,
            baseInstrumentId: 1,
            baseExchangeRate: 1,
            baseAmount: BANK_AMOUNT,
            quotedInstrumentId,
            quotedAmount: BANK_AMOUNT,
            quotedUnitPrice: QUOTED_UNIT_PRICE,
            toIban: null,
            categoryId: null,
            mccCategoryId: null,
            originalTransactionId: null
        } satisfies TransactionEntryCreateEntityInterface)
        .run();

    return transaction;
};

const seedP2pBuy = (bankAccount: AccountEntityInterface): TransactionEntityInterface => {
    const usdt = seedUsdt();
    const binanceAccount = seedAccount(AccountTypeEnum.CRYPTO_SYNC, usdt.id);

    seedExchangeRate(1, usdt.id, QUOTED_UNIT_PRICE);

    return seedP2pBuyIncome(binanceAccount.id, bankAccount.instrumentId);
};

const fetchBankBalance = (accountId: number): number =>
    getDefined(accountBalanceRepository.getByAccountId(accountId).get(), () => {
        throw new Error('Failed to fetch bank account balance');
    }).balance;

const fetchTotalExpense = (): number =>
    getDefined(statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, 1).get(), () => {
        throw new Error('Failed to fetch total statistics');
    }).expense;

const seedP2pBuyWithFee = (accountTitle: string) => {
    const bankAccount = testSeedService.bankSyncAccount(accountTitle, ExternalSourceEnum.MONOBANK, null);
    const bankExpense = seedBankBuyExpense(bankAccount.id);

    seedFeeEntry(bankExpense.id, bankAccount.id);
    seedP2pBuy(bankAccount);

    return { bankAccount, bankExpense };
};

const runScopedBankRepair = (bankExpenseId: number) =>
    runConsolidation({
        operatedAtFrom: new Date(OPERATED_AT.getTime() - 60_000),
        operatedAtTo: new Date(OPERATED_AT.getTime() + 60_000),
        transactionIds: [bankExpenseId]
    });

const expectLiveCanonicalFeeEntry = (entries: TransactionEntryEntityInterface[]): void => {
    expect(entries.filter(entry => entry.type === TransactionEntryTypeEnum.FEE && entry.originalTransactionId === null)).toHaveLength(1);
};

const expectFeeAggregates = (bankAccountId: number): void => {
    expect(fetchBankBalance(bankAccountId)).toBe(-(BANK_AMOUNT + BANK_FEE_AMOUNT));
    expect(fetchTotalExpense()).toBe(BANK_FEE_AMOUNT);
};

describe('consolidation/p2p-fiat-transfer', () => {
    it('preserves fee rows while matching the primary bank expense entry', async () => {
        const { bankAccount, bankExpense } = seedP2pBuyWithFee('Monobank P2P');

        const result = await runConsolidation();
        const [canonical] = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER);

        expect(result.consolidated).toBe(1);
        expectLiveCanonicalFeeEntry(testQueryService.fetchEntriesByTransactionId(canonical.id));
        expect(
            testQueryService.fetchEntriesByTransactionId(canonical.id).filter(entry => entry.originalTransactionId === bankExpense.id)
        ).toHaveLength(2);
        expectFeeAggregates(bankAccount.id);

        const repairResult = await runScopedBankRepair(bankExpense.id);
        const [repairedCanonical] = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER);

        expect(repairResult.consolidated).toBe(0);
        expectLiveCanonicalFeeEntry(testQueryService.fetchEntriesByTransactionId(repairedCanonical.id));
    });

    it('ignores non-primary bank entries when checking scoped P2P repair candidates', async () => {
        const { bankAccount, bankExpense } = seedP2pBuyWithFee('Monobank P2P repair');

        const result = await runConsolidation();
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

        const repairResult = await runScopedBankRepair(bankExpense.id);

        expect(result.consolidated).toBe(1);
        expect(repairResult.consolidated).toBe(0);
    });

    it('rejects buy combinations that reuse the same bank transaction id', async () => {
        const bankAccount = testSeedService.bankSyncAccount('Monobank split entry P2P', ExternalSourceEnum.MONOBANK, null);
        const bankExpense = testSeedService.bankPairExpense(
            { externalId: 'mono-p2p-split-expense', operatedAt: OPERATED_AT },
            { accountId: bankAccount.id, amount: SPLIT_BANK_PRIMARY_AMOUNT }
        );

        testDb
            .insert(TransactionEntryEntityTable)
            .values({
                transactionId: bankExpense.id,
                accountId: bankAccount.id,
                type: TransactionEntryTypeEnum.CREDIT,
                amount: SPLIT_BANK_EXTRA_AMOUNT,
                externalId: 'mono-p2p-split-expense-extra',
                exchangeRate: 1,
                baseInstrumentId: 1,
                baseExchangeRate: 1,
                baseAmount: SPLIT_BANK_EXTRA_AMOUNT,
                toIban: null,
                categoryId: null,
                mccCategoryId: null,
                originalTransactionId: null
            } satisfies TransactionEntryCreateEntityInterface)
            .run();
        seedP2pBuy(bankAccount);

        const result = await runConsolidation();

        expect(result.consolidated).toBe(0);
        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(0);
    });

    it.each([AccountTypeEnum.CASH, AccountTypeEnum.DEBT, AccountTypeEnum.STOCKS, AccountTypeEnum.CRYPTO])(
        'does not match a P2P buy against %s accounts',
        async accountType => {
            const instrument = accountType === AccountTypeEnum.STOCKS ? testSeedService.instrument(seedFiatInstrument('AAPL')) : null;
            const account = seedAccount(accountType, instrument?.id ?? 1);

            seedBankBuyExpense(account.id);
            seedP2pBuy(account);

            const result = await runConsolidation();

            expect(result.consolidated).toBe(0);
            expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(0);
        }
    );
});
