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
import { TransferConsolidationService } from '@budgie/sync';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
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

export const seedP2pFiatTransferFixture = Effect.fnUntraced(function* () {
    const uah = yield* requireInstrument(CurrencyEnum.UAH);
    const usdt = yield* seed.instrument({ code: 'USDT', name: 'Tether', symbol: 'USDT', type: InstrumentTypeEnum.CRYPTO });
    const bankAccount = yield* seed.account({
        title: 'Monobank UAH',
        type: AccountTypeEnum.BANK_SYNC,
        externalSource: ExternalSourceEnum.MONOBANK,
        instrumentId: uah.id
    });
    const binanceAccount = yield* seed.account({
        title: 'Binance SPOT · USDT',
        type: AccountTypeEnum.CRYPTO_SYNC,
        externalSource: ExternalSourceEnum.BINANCE,
        instrumentId: usdt.id
    });

    const usd = yield* requireInstrument(CurrencyEnum.USD);

    yield* testDb.update(SettingsEntityTable).set({ defaultInstrumentId: usd.id });
    yield* seedExchangeRate(uah.id, usd.id, USD_PER_UAH_RATE);
    yield* seedExchangeRate(usd.id, usdt.id, USD_PER_USDT_RATE);

    const fixture: P2pFiatTransferFixture = { uah, usdt, bankAccount, binanceAccount };

    return fixture;
});

export const seedP2pPair = (expenseLeg: P2pLeg, incomeLeg: P2pLeg, incomeOffsetMs = BANK_LEG_OFFSET_MS) =>
    Effect.gen(function* () {
        const expense = yield* seedBankPair.expense(
            { externalId: expenseLeg.externalId, operatedAt: P2P_OPERATED_AT },
            { accountId: expenseLeg.accountId, amount: expenseLeg.amount }
        );
        const income = yield* seedBankPair.income(
            { externalId: incomeLeg.externalId, operatedAt: new Date(P2P_OPERATED_AT.getTime() + incomeOffsetMs) },
            { accountId: incomeLeg.accountId, amount: incomeLeg.amount }
        );

        return { expense, income };
    });

export const seedP2pIncome = (
    externalId: string,
    accountId: number,
    quote?: Required<Pick<TransactionEntryCreateEntityInterface, 'quotedInstrumentId' | 'quotedAmount' | 'quotedUnitPrice'>>
) =>
    Effect.gen(function* () {
        const transaction = yield* seedBankPair.income({ externalId, operatedAt: P2P_OPERATED_AT }, { accountId, amount: P2P_USDT_AMOUNT });

        if (isDefined(quote)) {
            yield* testDb
                .update(TransactionEntryEntityTable)
                .set(quote)
                .where(eq(TransactionEntryEntityTable.transactionId, transaction.id));
        }

        return transaction;
    });

export const fetchP2pCanonical = () =>
    Effect.gen(function* () {
        return getDefined((yield* fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).at(0), () => {
            throw new Error('P2P canonical transaction not found');
        });
    });

export const expectConsolidatedToP2pCanonical = (
    expense: TransactionEntityInterface,
    income: TransactionEntityInterface,
    fromAccountId: number,
    toAccountId: number
) =>
    Effect.gen(function* () {
        const canonical = yield* fetchP2pCanonical();
        expect(canonical.fromAccountId).toBe(fromAccountId);
        expect(canonical.toAccountId).toBe(toAccountId);
        expect((yield* fetchTransactionById(expense.id)).consolidationParentTransactionId).toBe(canonical.id);
        expect((yield* fetchTransactionById(income.id)).consolidationParentTransactionId).toBe(canonical.id);
    });

export const expectP2pUnconsolidated = Effect.fnUntraced(function* (transactions: readonly TransactionEntityInterface[]) {
    const transferConsolidationService = yield* TransferConsolidationService;

    expect((yield* transferConsolidationService.consolidate(null)).consolidated).toBe(0);
    expect(yield* fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(0);
    expect(
        (yield* Effect.forEach(transactions, transaction => fetchTransactionById(transaction.id))).map(
            transaction => transaction.consolidationParentTransactionId
        )
    ).toEqual(transactions.map(() => null));
});
