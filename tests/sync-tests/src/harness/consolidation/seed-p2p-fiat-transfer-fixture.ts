import {
    AccountTypeEnum,
    CurrencyEnum,
    ExternalSourceEnum,
    InstrumentTypeEnum,
    PRECISION,
    SettingsEntityTable,
    TransactionConsolidationTypeEnum,
    TransactionEntryEntityTable
} from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { expect } from 'vitest';

import { getDefined, isDefined } from '@rnw-community/shared';

import { fetchCanonicalsOfType } from '../db/fetch-canonicals-of-type';
import { fetchTransactionById } from '../db/fetch-transaction-by-id';
import { requireInstrument } from '../db/require-instrument';
import { testDb } from '../scenario/setup';
import { seed } from '../seed/seed';
import { seedBankPair } from '../seed/seed-bank-pair';

import { seedExchangeRate } from './seed-exchange-rate';

import type {
    AccountEntityInterface,
    InstrumentEntityInterface,
    TransactionEntityInterface,
    TransactionEntryCreateEntityInterface
} from '@budgie/contracts';

const UAH_PER_USD_RATE = 40;
const USD_PER_UAH_RATE = 1 / UAH_PER_USD_RATE;
const USD_PER_USDT_RATE = 1;
const BANK_LEG_OFFSET_MS = 2 * 60 * 1000;

interface P2pFiatTransferFixture {
    readonly uah: InstrumentEntityInterface;
    readonly usdt: InstrumentEntityInterface;
    readonly bankAccount: AccountEntityInterface;
    readonly binanceAccount: AccountEntityInterface;
}

interface P2pLeg {
    readonly externalId: string;
    readonly accountId: number;
    readonly amount: number;
}

export const P2P_UAH_TOTAL = Number('4000') * PRECISION;
export const P2P_USDT_AMOUNT = 100 * PRECISION;
export const P2P_OPERATED_AT = new Date('2026-01-15T12:00:00.000Z');
export const P2P_ONE_HOUR_MS = 60 * 60 * 1000;
export const P2P_OUT_OF_WINDOW_OFFSET_MS = 3 * P2P_ONE_HOUR_MS;

export const seedP2pFiatTransferFixture = async (): Promise<P2pFiatTransferFixture> => {
    const uah = await requireInstrument(CurrencyEnum.UAH);
    const usdt = seed.instrument({ code: 'USDT', name: 'Tether', symbol: 'USDT', type: InstrumentTypeEnum.CRYPTO });
    const bankAccount = seed.account({
        title: 'Monobank UAH',
        type: AccountTypeEnum.BANK_SYNC,
        externalSource: ExternalSourceEnum.MONOBANK,
        instrumentId: uah.id
    });
    const binanceAccount = seed.account({
        title: 'Binance SPOT · USDT',
        type: AccountTypeEnum.CRYPTO_SYNC,
        externalSource: ExternalSourceEnum.BINANCE,
        instrumentId: usdt.id
    });

    const usd = await requireInstrument(CurrencyEnum.USD);

    testDb.update(SettingsEntityTable).set({ defaultInstrumentId: usd.id }).run();
    seedExchangeRate(uah.id, usd.id, USD_PER_UAH_RATE);
    seedExchangeRate(usd.id, usdt.id, USD_PER_USDT_RATE);

    return { uah, usdt, bankAccount, binanceAccount };
};

export const seedP2pPair = (
    expenseLeg: P2pLeg,
    incomeLeg: P2pLeg,
    incomeOffsetMs = BANK_LEG_OFFSET_MS
): { expense: TransactionEntityInterface; income: TransactionEntityInterface } => {
    const expense = seedBankPair.expense(
        { externalId: expenseLeg.externalId, operatedAt: P2P_OPERATED_AT },
        { accountId: expenseLeg.accountId, amount: expenseLeg.amount }
    );
    const income = seedBankPair.income(
        { externalId: incomeLeg.externalId, operatedAt: new Date(P2P_OPERATED_AT.getTime() + incomeOffsetMs) },
        { accountId: incomeLeg.accountId, amount: incomeLeg.amount }
    );

    return { expense, income };
};

export const seedP2pIncome = (
    externalId: string,
    accountId: number,
    quote?: Required<Pick<TransactionEntryCreateEntityInterface, 'quotedInstrumentId' | 'quotedAmount' | 'quotedUnitPrice'>>
): TransactionEntityInterface => {
    const transaction = seedBankPair.income({ externalId, operatedAt: P2P_OPERATED_AT }, { accountId, amount: P2P_USDT_AMOUNT });

    if (isDefined(quote)) {
        testDb.update(TransactionEntryEntityTable).set(quote).where(eq(TransactionEntryEntityTable.transactionId, transaction.id)).run();
    }

    return transaction;
};

export const fetchP2pCanonical = (): TransactionEntityInterface =>
    getDefined(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER).at(0), () => {
        throw new Error('P2P canonical transaction not found');
    });

export const expectConsolidatedToP2pCanonical = (
    expense: TransactionEntityInterface,
    income: TransactionEntityInterface,
    fromAccountId: number,
    toAccountId: number
): void => {
    const canonical = fetchP2pCanonical();
    expect(canonical.fromAccountId).toBe(fromAccountId);
    expect(canonical.toAccountId).toBe(toAccountId);
    expect(fetchTransactionById(expense.id).consolidationParentTransactionId).toBe(canonical.id);
    expect(fetchTransactionById(income.id).consolidationParentTransactionId).toBe(canonical.id);
};

export const expectP2pUnconsolidated = (transactions: readonly TransactionEntityInterface[]): void => {
    expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(0);
    expect(transactions.map(transaction => fetchTransactionById(transaction.id).consolidationParentTransactionId)).toEqual(
        transactions.map(() => null)
    );
};
