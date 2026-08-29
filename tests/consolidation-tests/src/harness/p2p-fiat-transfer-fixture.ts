import {
    AccountNatureEnum,
    AccountTypeEnum,
    ExchangeRateEntityTable,
    ExternalSourceEnum,
    InstrumentTypeEnum,
    PRECISION,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { testDb, testSeedService } from './test-context';

import type {
    AccountEntityInterface,
    InstrumentCreateEntityInterface,
    TransactionCreateEntityInterface,
    TransactionEntryCreateEntityInterface,
    TransactionEntityInterface
} from '@budgie/contracts';

export const P2P_OPERATED_AT = new Date('2026-02-20T10:00:00.000Z');
const P2P_ASSET_AMOUNT = 1_000 * PRECISION;
const P2P_QUOTED_UNIT_PRICE = 41 * PRECISION;
export const P2P_BANK_AMOUNT = (P2P_QUOTED_UNIT_PRICE * P2P_ASSET_AMOUNT) / PRECISION;
export const P2P_SPLIT_BANK_PRIMARY_AMOUNT = 20 * P2P_ASSET_AMOUNT;
export const P2P_SPLIT_BANK_EXTRA_AMOUNT = 21 * P2P_ASSET_AMOUNT;

export const seedP2pUsdt = () =>
    testSeedService.instrument({
        code: 'USDT',
        name: 'Tether',
        symbol: 'USDT',
        type: InstrumentTypeEnum.CRYPTO
    });

export const seedP2pExchangeRate = (baseInstrumentId: number, quoteInstrumentId: number, rate: number): void => {
    testDb.insert(ExchangeRateEntityTable).values({ baseInstrumentId, quoteInstrumentId, rate, source: 'test' }).run();
};

export const seedP2pFiatInstrument = (code: string): Pick<InstrumentCreateEntityInterface, 'code' | 'name' | 'symbol' | 'type'> => ({
    code,
    name: code,
    symbol: code,
    type: InstrumentTypeEnum.FIAT
});

export const seedP2pAccount = (type: AccountTypeEnum, instrumentId: number): AccountEntityInterface =>
    testSeedService.account({
        title: `${type} P2P account`,
        type,
        nature: type === AccountTypeEnum.DEBT ? AccountNatureEnum.LIABILITY : AccountNatureEnum.ASSET,
        instrumentId,
        icon: UserIconNameEnum.Wallet,
        externalId: `${type}-p2p-account`
    });

export const seedP2pBankBuyExpense = (accountId: number): TransactionEntityInterface =>
    testSeedService.bankPairExpense(
        { externalId: 'mono-p2p-bank-expense', operatedAt: P2P_OPERATED_AT },
        { accountId, amount: P2P_BANK_AMOUNT }
    );

export const seedP2pBuyIncome = (accountId: number, quotedInstrumentId: number | null): TransactionEntityInterface => {
    const transaction = testDb
        .insert(TransactionEntityTable)
        .values({
            type: TransactionTypeEnum.INCOME,
            title: 'Binance P2P buy USDT',
            externalId: 'binance:c2c:order-1',
            externalSource: ExternalSourceEnum.BINANCE,
            operatedAt: new Date(P2P_OPERATED_AT.getTime() + 30_000),
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
            externalId: 'binance:c2c:order-1',
            exchangeRate: 1,
            baseInstrumentId: 1,
            baseExchangeRate: 1,
            baseAmount: P2P_BANK_AMOUNT,
            quotedInstrumentId,
            quotedAmount: isDefined(quotedInstrumentId) ? P2P_BANK_AMOUNT : null,
            quotedUnitPrice: isDefined(quotedInstrumentId) ? P2P_QUOTED_UNIT_PRICE : null,
            toIban: null,
            categoryId: null,
            mccCategoryId: null,
            originalTransactionId: null
        } satisfies TransactionEntryCreateEntityInterface)
        .run();

    return transaction;
};

export const seedP2pBuy = (bankAccount: AccountEntityInterface): TransactionEntityInterface => {
    const usdt = seedP2pUsdt();
    const binanceAccount = seedP2pAccount(AccountTypeEnum.CRYPTO_SYNC, usdt.id);

    seedP2pExchangeRate(1, usdt.id, P2P_QUOTED_UNIT_PRICE);

    return seedP2pBuyIncome(binanceAccount.id, bankAccount.instrumentId);
};
