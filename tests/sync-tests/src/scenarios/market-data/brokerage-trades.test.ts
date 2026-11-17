import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { BrokerageService } from '@app/brokerage/service/brokerage.service';
import { getSecurityTrade } from '@app/transaction/utils/get-security-trade.util';
import { sumEntryAmounts } from '@app/transaction/utils/sum-entry-amounts.util';
import {
    AccountBalanceRepository,
    AccountRepository,
    ExternalSourceEnum,
    AccountTypeEnum,
    InstrumentTypeEnum,
    LanguageEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryPositionRepository,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTypeEnum,
    TransactionViewRepository,
    UserIconNameEnum,
    convertFromMicroUnits
} from '@budgie/contracts';
import { AccountArchiveService, AccountService, BalanceAdjustmentService, TransactionService } from '@budgie/ledger';
import { calculateInstrumentPosition } from '@budgie/market';
import { describe, expect, it } from '@effect/vitest';
import { and, eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import { HttpResponse, http } from 'msw';

import { isDefined } from '@rnw-community/shared';

import { fetchAccountBalance, fetchBalanceAdjustments, fetchExpenseEntries, requireInstrument, seed, TestLayer } from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';
import { testDb } from '../../harness/scenario/test-db';

import type { SecurityTradeFormValues } from '@app/brokerage/constant/security-trade-form-schema.constant';

const LISTING = { symbol: 'BGTX', name: 'Budgie Example Holdings', exchange: 'E2E Exchange', type: InstrumentTypeEnum.EQUITY } as const;
const TRADE_DAY = new Date('2026-03-02T12:00:00.000Z');
const FUNDING_TITLE = 'Deposit';
const MARCH = (day: number) => new Date(`2026-03-${String(day).padStart(2, '0')}T12:00:00.000Z`);
const justBefore = (date: Date) => new Date(date.getTime() - 1_000);
const LEGACY_CASH_CREATED_AT = 1_794_548_699;
const fundingIds = Effect.map(
    testDb
        .select({ id: TransactionEntityTable.id })
        .from(TransactionEntityTable)
        .where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.BROKERAGE_FUNDING)),
    rows => rows.map(row => row.id)
);
const replayFundingMigration = testDb.$client.unsafe(
    readFileSync(resolve(process.cwd(), '../../packages/app/drizzle/20261117202013_brokerage_funding_marker/migration.sql'), 'utf8')
).raw;

const findTradeIds = (securityId: number) =>
    Effect.map(testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.accountId, securityId)), entries =>
        entries.map(entry => entry.transactionId)
    );

const createBrokerageWithBalance = (currentBalance: number) =>
    Effect.gen(function* () {
        mockServer.use(
            http.get('https://query1.finance.yahoo.com/v8/finance/chart/:symbol', () =>
                HttpResponse.json({ chart: { result: [{ meta: { currency: 'USD' }, indicators: { quote: [{ close: [] }] } }] } })
            )
        );
        const dollar = yield* requireInstrument('USD');
        const brokerageService = yield* BrokerageService;
        const cash = yield* brokerageService.create({
            title: 'Broker',
            type: AccountTypeEnum.STOCKS,
            icon: UserIconNameEnum.ChartLine,
            instrumentId: dollar.id,
            currentBalance,
            includeInNetWorth: true,
            isActive: true
        });

        return { dollar, brokerageService, cash };
    });

const createBrokerage = createBrokerageWithBalance(0);

const createLegacyBrokerage = Effect.tap(createBrokerageWithBalance(800), ({ cash }) =>
    Effect.andThen(
        testDb.$client.unsafe(`UPDATE transactions SET created_at = ${LEGACY_CASH_CREATED_AT} WHERE to_account_id = ${cash.id}`).raw,
        testDb.$client.unsafe(`UPDATE accounts SET created_at = ${LEGACY_CASH_CREATED_AT} WHERE id = ${cash.id}`).raw
    )
);

const readTrade = (id: number) =>
    Effect.flatMap(TransactionViewRepository, repository => repository.getById(id, LanguageEnum.EN)).pipe(
        Effect.map(transaction => (isDefined(transaction) ? getSecurityTrade(transaction) : null))
    );

const buyTwentyOne = (price: number) =>
    Effect.flatMap(createBrokerage, brokerage =>
        Effect.map(
            brokerage.brokerageService.buy(
                brokerage.cash.integrationId ?? 0,
                LISTING,
                { quantity: 21, price, fee: 0, operatedAt: TRADE_DAY },
                FUNDING_TITLE
            ),
            securityId => ({ ...brokerage, securityId })
        )
    );

const editToBrokerTotal = (transactionId: number, securityId: number, quoteInstrumentId: number) =>
    Effect.gen(function* () {
        const brokerageService = yield* BrokerageService;
        const accountRepository = yield* AccountRepository;
        const positionRepository = yield* TransactionEntryPositionRepository;

        yield* brokerageService.update(
            transactionId,
            { quantity: 21, price: 41.949, fee: 25.15, total: 906.08, operatedAt: TRADE_DAY },
            FUNDING_TITLE
        );

        const security = yield* accountRepository.findById(securityId);

        return calculateInstrumentPosition(
            yield* positionRepository.findInstrumentPositionEntries(security?.instrumentId ?? 0, quoteInstrumentId)
        );
    });

const buyTen = (price: number, operatedAt: Date) => ({ quantity: 10, price, fee: 0, operatedAt });

const createTradedBrokerage = Effect.gen(function* () {
    const brokerage = yield* createBrokerage;
    const securityId = yield* brokerage.brokerageService.buy(
        brokerage.cash.integrationId ?? 0,
        LISTING,
        buyTen(100, MARCH(2)),
        FUNDING_TITLE
    );

    yield* brokerage.brokerageService.sell(securityId, { quantity: 4, price: 125, fee: 0, operatedAt: MARCH(5) }, FUNDING_TITLE);

    const [buyId, sellId] = yield* findTradeIds(securityId);

    return { ...brokerage, securityId, buyId, sellId };
});

const editSellBeforeLaterBuy = (trade: SecurityTradeFormValues) =>
    Effect.gen(function* () {
        const { brokerageService, cash, sellId } = yield* createTradedBrokerage;

        yield* brokerageService.buy(
            cash.integrationId ?? 0,
            LISTING,
            { quantity: 2, price: 100, fee: 0, operatedAt: MARCH(11) },
            FUNDING_TITLE
        );
        yield* brokerageService.update(sellId, trade, FUNDING_TITLE);

        return cash;
    });

describe('market-data/brokerage-trades', () => {
    it.effect('buys and partly sells a security against brokerage cash with FIFO cost and realized return', () =>
        Effect.gen(function* () {
            const { dollar, brokerageService, cash } = yield* createBrokerage;
            const accountRepository = yield* AccountRepository;
            const positionRepository = yield* TransactionEntryPositionRepository;

            const balances = yield* AccountBalanceRepository;
            const homeRows = yield* balances.getHomeAccountRows(dollar.id);

            expect(homeRows.find(row => row.account.id === cash.id)).toMatchObject({
                account: { integrationId: cash.integrationId },
                integrationLabel: 'Broker',
                integrationProvider: ExternalSourceEnum.MANUAL
            });

            const securityId = yield* brokerageService.buy(
                cash.integrationId ?? 0,
                LISTING,
                {
                    quantity: 10,
                    price: 100,
                    fee: 5,
                    operatedAt: TRADE_DAY
                },
                FUNDING_TITLE
            );
            expect(
                yield* brokerageService
                    .sell(securityId, { quantity: 11, price: 125, fee: 0, operatedAt: TRADE_DAY }, FUNDING_TITLE)
                    .pipe(Effect.flip)
            ).toMatchObject({ _tag: 'InsufficientSecurityHoldingError' });
            expect(
                yield* brokerageService
                    .sell(securityId, { quantity: 1, price: 125, fee: 0, operatedAt: new Date('2026-03-01') }, FUNDING_TITLE)
                    .pipe(Effect.flip)
            ).toMatchObject({ _tag: 'InsufficientSecurityHoldingError' });
            expect(yield* fetchAccountBalance(securityId)).toBe(10_000_000);
            yield* brokerageService.sell(securityId, { quantity: 4, price: 125, fee: 0, operatedAt: TRADE_DAY }, FUNDING_TITLE);

            const security = yield* accountRepository.findById(securityId);
            const entries = yield* positionRepository.findInstrumentPositionEntries(security?.instrumentId ?? 0, dollar.id);

            expect(security).toMatchObject({ type: AccountTypeEnum.STOCKS, integrationId: cash.integrationId });
            expect(security?.instrument).toMatchObject({ type: InstrumentTypeEnum.EQUITY, symbol: 'BGTX', quoteInstrumentId: dollar.id });
            expect(yield* fetchAccountBalance(securityId)).toBe(6_000_000);
            expect(yield* fetchAccountBalance(cash.id)).toBe(500_000_000);
            expect(yield* fetchBalanceAdjustments(cash.id)).toEqual([
                { title: FUNDING_TITLE, amount: 1_005_000_000, type: TransactionEntryTypeEnum.DEBIT, operatedAt: justBefore(TRADE_DAY) }
            ]);
            expect(calculateInstrumentPosition(entries)).toEqual({
                amount: 6,
                costBasis: 603,
                averageCost: 100.5,
                realizedProfitLoss: 98
            });
            yield* brokerageService.sell(
                securityId,
                { quantity: 6, price: 125, fee: 0, operatedAt: new Date('2026-03-10') },
                FUNDING_TITLE
            );
            expect(
                yield* brokerageService
                    .sell(securityId, { quantity: 1, price: 125, fee: 0, operatedAt: new Date('2026-03-05') }, FUNDING_TITLE)
                    .pipe(Effect.flip)
            ).toMatchObject({ _tag: 'InsufficientSecurityHoldingError' });
            yield* brokerageService.buy(
                cash.integrationId ?? 0,
                LISTING,
                {
                    quantity: 2,
                    price: 100,
                    fee: 0,
                    operatedAt: new Date('2026-03-11')
                },
                FUNDING_TITLE
            );
            expect(yield* fetchAccountBalance(cash.id)).toBe(1_050_000_000);
            expect(yield* fetchBalanceAdjustments(cash.id)).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('stores a sell with a fee as gross cash plus a fee entry, so the brokerage row shows gross proceeds and the fee as net', () =>
        Effect.gen(function* () {
            const { brokerageService, cash } = yield* createBrokerage;
            const securityId = yield* brokerageService.buy(
                cash.integrationId ?? 0,
                LISTING,
                {
                    quantity: 10,
                    price: 100,
                    fee: 0,
                    operatedAt: TRADE_DAY
                },
                FUNDING_TITLE
            );

            yield* brokerageService.sell(securityId, { quantity: 4, price: 125, fee: 3, operatedAt: TRADE_DAY }, FUNDING_TITLE);

            const [feeEntry] = yield* testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.FEE));
            const sellEntries = yield* fetchExpenseEntries(feeEntry.transactionId);
            const sellCashEntries = sellEntries.filter(entry => entry.accountId === cash.id);
            const fee = sumEntryAmounts(sellCashEntries.filter(entry => entry.type === TransactionEntryTypeEnum.FEE));

            expect(sellCashEntries.map(({ type, amount }) => ({ type, amount }))).toEqual(
                expect.arrayContaining([
                    { type: TransactionEntryTypeEnum.DEBIT, amount: 500_000_000 },
                    { type: TransactionEntryTypeEnum.FEE, amount: 3_000_000 }
                ])
            );
            expect(
                convertFromMicroUnits(sumEntryAmounts(sellCashEntries.filter(entry => entry.type !== TransactionEntryTypeEnum.FEE)))
            ).toBe(500);
            expect(convertFromMicroUnits(fee)).toBe(3);
            expect(yield* fetchAccountBalance(cash.id)).toBe(497_000_000);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rounds trade cash and fee to cents before storing them', () =>
        Effect.gen(function* () {
            const { brokerageService, cash } = yield* createBrokerage;

            yield* brokerageService.buy(
                cash.integrationId ?? 0,
                LISTING,
                {
                    quantity: 21,
                    price: 43.1471,
                    fee: 25.157,
                    operatedAt: TRADE_DAY
                },
                FUNDING_TITLE
            );

            expect(yield* fetchAccountBalance(cash.id)).toBe(0);
            expect(yield* fetchBalanceAdjustments(cash.id)).toEqual([
                {
                    title: FUNDING_TITLE,
                    amount: 906_090_000 + 25_160_000,
                    type: TransactionEntryTypeEnum.DEBIT,
                    operatedAt: justBefore(TRADE_DAY)
                }
            ]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('funds every dip of the cash account just in time, including a later unrelated expense', () =>
        Effect.gen(function* () {
            const { brokerageService, cash } = yield* createBrokerage;

            yield* seed.manualExpense({ accountId: cash.id, amount: 50_000_000, operatedAt: new Date('2026-03-10T12:00:00.000Z') });
            yield* brokerageService.buy(
                cash.integrationId ?? 0,
                LISTING,
                { quantity: 10, price: 10, fee: 0, operatedAt: TRADE_DAY },
                FUNDING_TITLE
            );

            expect(yield* fetchBalanceAdjustments(cash.id)).toEqual([
                { title: FUNDING_TITLE, amount: 100_000_000, type: TransactionEntryTypeEnum.DEBIT, operatedAt: justBefore(TRADE_DAY) },
                {
                    title: FUNDING_TITLE,
                    amount: 50_000_000,
                    type: TransactionEntryTypeEnum.DEBIT,
                    operatedAt: justBefore(new Date('2026-03-10T12:00:00.000Z'))
                }
            ]);
            expect(yield* fetchAccountBalance(cash.id)).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('edits a buy in place to the broker total so the cost basis matches and the cash stays funded', () =>
        Effect.gen(function* () {
            const { dollar, brokerageService, cash, securityId } = yield* buyTwentyOne(37.8571);
            const [buyId] = yield* findTradeIds(securityId);

            expect(yield* editToBrokerTotal(buyId, securityId, dollar.id)).toMatchObject({ amount: 21, costBasis: 906.08 });

            const tradeEntries = yield* fetchExpenseEntries(buyId);

            expect(tradeEntries.map(({ accountId, type, amount }) => ({ accountId, type, amount }))).toEqual(
                expect.arrayContaining([
                    { accountId: cash.id, type: TransactionEntryTypeEnum.CREDIT, amount: 880_930_000 },
                    { accountId: cash.id, type: TransactionEntryTypeEnum.FEE, amount: 25_150_000 },
                    { accountId: securityId, type: TransactionEntryTypeEnum.DEBIT, amount: 21_000_000 }
                ])
            );
            expect(yield* fetchAccountBalance(securityId)).toBe(21_000_000);
            expect(yield* fetchAccountBalance(cash.id)).toBe(0);

            yield* brokerageService.sell(
                securityId,
                { quantity: 10, price: 50, fee: 0, operatedAt: new Date('2026-03-10') },
                FUNDING_TITLE
            );
            expect(
                yield* brokerageService
                    .update(buyId, { quantity: 5, price: 40, fee: 0, operatedAt: TRADE_DAY }, FUNDING_TITLE)
                    .pipe(Effect.flip)
            ).toMatchObject({ _tag: 'InsufficientSecurityHoldingError' });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('recognises a buy whose cash leg is missing as a trade and repairs it on edit to the broker total', () =>
        Effect.gen(function* () {
            const { dollar, cash, securityId } = yield* buyTwentyOne(0.01);
            const [buyId] = yield* findTradeIds(securityId);

            yield* testDb
                .delete(TransactionEntryEntityTable)
                .where(and(eq(TransactionEntryEntityTable.transactionId, buyId), eq(TransactionEntryEntityTable.accountId, cash.id)));

            expect(yield* readTrade(buyId)).toMatchObject({ isBuy: true, cashInstrument: { id: dollar.id }, quantity: 21_000_000, fee: 0 });

            expect(yield* editToBrokerTotal(buyId, securityId, dollar.id)).toMatchObject({ amount: 21, costBasis: 906.08 });
            expect(yield* readTrade(buyId)).toMatchObject({ isBuy: true, fee: 25_150_000, cashFlow: -906_080_000 });
            expect(yield* fetchAccountBalance(securityId)).toBe(21_000_000);
            expect(yield* fetchAccountBalance(cash.id)).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('edits a buy whose cash account was archived by restoring that account even when another cash account is active', () =>
        Effect.gen(function* () {
            const { dollar, cash, securityId } = yield* buyTwentyOne(37.8571);
            const accountArchiveService = yield* AccountArchiveService;
            const accountRepository = yield* AccountRepository;
            const accountService = yield* AccountService;
            const [buyId] = yield* findTradeIds(securityId);

            yield* accountArchiveService.archiveById(cash.id);

            const otherCash = yield* accountService.create({
                title: 'Broker cash',
                type: AccountTypeEnum.STOCKS,
                icon: UserIconNameEnum.ChartLine,
                instrumentId: dollar.id,
                currentBalance: 0,
                includeInNetWorth: true,
                isActive: true,
                externalSource: ExternalSourceEnum.MANUAL,
                integrationId: cash.integrationId
            });

            expect(yield* readTrade(buyId)).toMatchObject({ isBuy: true, cashInstrument: { id: dollar.id }, quantity: 21_000_000 });
            expect(yield* editToBrokerTotal(buyId, securityId, dollar.id)).toMatchObject({ amount: 21, costBasis: 906.08 });
            expect(yield* accountRepository.findById(cash.id)).toMatchObject({ id: cash.id, deletedAt: null });
            expect(
                (yield* fetchExpenseEntries(buyId))
                    .filter(entry => entry.accountId !== securityId)
                    .map(({ accountId, type, amount }) => ({ accountId, type, amount }))
            ).toEqual([
                { accountId: cash.id, type: TransactionEntryTypeEnum.CREDIT, amount: 880_930_000 },
                { accountId: cash.id, type: TransactionEntryTypeEnum.FEE, amount: 25_150_000 }
            ]);
            expect(yield* readTrade(buyId)).toMatchObject({ fee: 25_150_000, cashFlow: -906_080_000 });
            expect(yield* fetchAccountBalance(securityId)).toBe(21_000_000);
            expect(yield* fetchAccountBalance(cash.id)).toBe(0);
            expect(yield* fetchAccountBalance(otherCash.id)).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('edits a sell whose security account was archived by restoring that security account', () =>
        Effect.gen(function* () {
            const { brokerageService, cash, securityId, sellId } = yield* createTradedBrokerage;
            const accountArchiveService = yield* AccountArchiveService;
            const accountRepository = yield* AccountRepository;

            yield* accountArchiveService.archiveById(securityId);
            yield* brokerageService.update(sellId, { quantity: 4, price: 150, fee: 0, operatedAt: MARCH(5) }, FUNDING_TITLE);

            expect(yield* accountRepository.findById(securityId)).toMatchObject({ id: securityId, deletedAt: null });
            expect((yield* fetchExpenseEntries(sellId)).map(({ accountId, type, amount }) => ({ accountId, type, amount }))).toEqual(
                expect.arrayContaining([
                    { accountId: securityId, type: TransactionEntryTypeEnum.CREDIT, amount: 4_000_000 },
                    { accountId: cash.id, type: TransactionEntryTypeEnum.DEBIT, amount: 600_000_000 }
                ])
            );
            expect(yield* fetchAccountBalance(securityId)).toBe(6_000_000);
            expect(yield* fetchAccountBalance(cash.id)).toBe(600_000_000);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rejects an edited date that leaves the holding negative in between', () =>
        Effect.gen(function* () {
            const { brokerageService, securityId, buyId, sellId } = yield* createTradedBrokerage;

            expect(
                yield* brokerageService
                    .update(buyId, { quantity: 10, price: 100, fee: 0, operatedAt: MARCH(8) }, FUNDING_TITLE)
                    .pipe(Effect.flip)
            ).toMatchObject({ _tag: 'InsufficientSecurityHoldingError' });
            expect(
                yield* brokerageService
                    .update(sellId, { quantity: 4, price: 125, fee: 0, operatedAt: MARCH(1) }, FUNDING_TITLE)
                    .pipe(Effect.flip)
            ).toMatchObject({ _tag: 'InsufficientSecurityHoldingError' });
            expect(yield* fetchAccountBalance(securityId)).toBe(6_000_000);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('moves the funding with a buy moved earlier instead of duplicating it', () =>
        Effect.gen(function* () {
            const { brokerageService, cash } = yield* createBrokerage;
            const balances = yield* AccountBalanceRepository;
            const securityId = yield* brokerageService.buy(cash.integrationId ?? 0, LISTING, buyTen(10, MARCH(2)), FUNDING_TITLE);
            const [buyId] = yield* findTradeIds(securityId);
            const cashBefore = yield* fetchAccountBalance(cash.id);

            yield* brokerageService.update(buyId, buyTen(10, MARCH(1)), FUNDING_TITLE);

            expect(yield* fetchAccountBalance(cash.id)).toBe(cashBefore);
            expect(yield* balances.getMinimumLedgerBalanceFrom(cash.id, new Date('2026-02-28'))).toBeGreaterThanOrEqual(0);
            expect(yield* fetchBalanceAdjustments(cash.id)).toEqual([
                { title: FUNDING_TITLE, amount: 100_000_000, type: TransactionEntryTypeEnum.DEBIT, operatedAt: justBefore(MARCH(1)) }
            ]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('re-plans the funding of a buy moved earlier across an existing dip without inventing withdrawals', () =>
        Effect.gen(function* () {
            const { brokerageService, cash } = yield* createBrokerage;
            const balanceAdjustmentService = yield* BalanceAdjustmentService;
            const securityId = yield* brokerageService.buy(cash.integrationId ?? 0, LISTING, buyTen(10, MARCH(2)), FUNDING_TITLE);
            const [buyId] = yield* findTradeIds(securityId);

            yield* seed.manualExpense({ accountId: cash.id, amount: 50_000_000, operatedAt: new Date('2026-03-01T18:00:00.000Z') });
            yield* balanceAdjustmentService.create(cash.id, 50_000_000, new Date('2026-03-01T20:00:00.000Z'), 'Refill');
            yield* brokerageService.update(buyId, buyTen(15, MARCH(1)), FUNDING_TITLE);

            expect(yield* fetchAccountBalance(cash.id)).toBe(50_000_000);
            expect(yield* fetchBalanceAdjustments(cash.id)).toEqual(
                expect.arrayContaining([
                    { title: FUNDING_TITLE, amount: 150_000_000, type: TransactionEntryTypeEnum.DEBIT, operatedAt: justBefore(MARCH(1)) },
                    {
                        title: FUNDING_TITLE,
                        amount: 50_000_000,
                        type: TransactionEntryTypeEnum.DEBIT,
                        operatedAt: justBefore(new Date('2026-03-01T18:00:00.000Z'))
                    },
                    {
                        title: 'Refill',
                        amount: 50_000_000,
                        type: TransactionEntryTypeEnum.DEBIT,
                        operatedAt: new Date('2026-03-01T20:00:00.000Z')
                    }
                ])
            );
            expect(yield* fetchBalanceAdjustments(cash.id)).toHaveLength(3);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the cash funded between the dates when a sell moves later', () =>
        Effect.gen(function* () {
            const cash = yield* editSellBeforeLaterBuy({ quantity: 4, price: 125, fee: 0, operatedAt: MARCH(20) });
            const balances = yield* AccountBalanceRepository;

            expect(yield* fetchAccountBalance(cash.id)).toBe(500_000_000);
            expect(yield* balances.getMinimumLedgerBalanceFrom(cash.id, MARCH(2))).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('funds a later buy when an edited sell receives less', () =>
        Effect.gen(function* () {
            const cash = yield* editSellBeforeLaterBuy({ quantity: 4, price: 25, fee: 0, total: 100, operatedAt: MARCH(5) });
            const balances = yield* AccountBalanceRepository;

            expect(yield* balances.getMinimumLedgerBalanceFrom(cash.id, MARCH(2))).toBe(0);
            expect(yield* fetchBalanceAdjustments(cash.id)).toEqual(
                expect.arrayContaining([
                    {
                        title: FUNDING_TITLE,
                        amount: 100_000_000,
                        type: TransactionEntryTypeEnum.DEBIT,
                        operatedAt: justBefore(MARCH(11))
                    }
                ])
            );
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([
        { name: 'active', isArchived: false },
        { name: 'archived', isArchived: true }
    ])('edits a trade funded from an $name non-brokerage account without inventing a deposit', ({ isArchived }) =>
        Effect.gen(function* () {
            const { dollar, brokerageService, cash } = yield* createBrokerage;
            const accountArchiveService = yield* AccountArchiveService;
            const accountRepository = yield* AccountRepository;
            const securityId = yield* brokerageService.buy(
                cash.integrationId ?? 0,
                LISTING,
                { quantity: 1, price: 100, fee: 0, operatedAt: MARCH(2) },
                FUNDING_TITLE
            );
            const bank = yield* seed.account({ title: 'Bank', instrumentId: dollar.id });
            const transfer = yield* seed.directTransfer({
                exchangeRate: 1,
                operatedAt: MARCH(3),
                sourceAccountId: bank.id,
                sourceAmount: 500_000_000,
                sourceEntryExchangeRate: 1,
                targetAccountId: securityId,
                targetAmount: 5_000_000,
                toIban: null
            });

            if (isArchived) {
                yield* accountArchiveService.archiveById(bank.id);
            }

            yield* brokerageService.update(
                transfer.id,
                { quantity: 5, price: 120, fee: 0, total: 600, operatedAt: MARCH(3) },
                FUNDING_TITLE
            );

            expect(yield* fetchBalanceAdjustments(bank.id)).toEqual([]);
            expect(yield* fetchBalanceAdjustments(cash.id)).toHaveLength(1);
            expect(yield* fetchAccountBalance(bank.id)).toBe(-600_000_000);
            expect(yield* accountRepository.findById(bank.id)).toMatchObject({ id: bank.id, deletedAt: null });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('resizes the single funding deposit when a buy price is edited up and down', () =>
        Effect.gen(function* () {
            const { brokerageService, cash } = yield* createBrokerage;
            const securityId = yield* brokerageService.buy(cash.integrationId ?? 0, LISTING, buyTen(100, MARCH(2)), FUNDING_TITLE);
            const [buyId] = yield* findTradeIds(securityId);
            const expectFunding = (amount: number) =>
                Effect.gen(function* () {
                    expect(yield* fetchBalanceAdjustments(cash.id)).toEqual([
                        { title: FUNDING_TITLE, amount, type: TransactionEntryTypeEnum.DEBIT, operatedAt: justBefore(MARCH(2)) }
                    ]);
                    expect(yield* fetchAccountBalance(cash.id)).toBe(0);
                });

            yield* brokerageService.update(buyId, buyTen(120, MARCH(2)), FUNDING_TITLE);
            yield* expectFunding(1_200_000_000);
            yield* brokerageService.update(buyId, buyTen(80, MARCH(2)), FUNDING_TITLE);
            yield* expectFunding(800_000_000);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('drops the funding of a deleted buy on the next reconciliation', () =>
        Effect.gen(function* () {
            const { brokerageService, cash } = yield* createBrokerage;
            const transactionService = yield* TransactionService;
            const securityId = yield* brokerageService.buy(cash.integrationId ?? 0, LISTING, buyTen(100, MARCH(2)), FUNDING_TITLE);
            const [buyId] = yield* findTradeIds(securityId);

            yield* transactionService.deleteById(buyId);
            yield* brokerageService.reconcileFunding(FUNDING_TITLE);

            expect(yield* fetchBalanceAdjustments(cash.id)).toEqual([]);
            expect(yield* fetchAccountBalance(cash.id)).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('repairs a legacy brokerage with an opening balance and stacked funding into one deposit before the backdated buy', () =>
        Effect.gen(function* () {
            const { brokerageService, cash } = yield* createLegacyBrokerage;
            const balanceAdjustmentService = yield* BalanceAdjustmentService;
            const transactionRepository = yield* TransactionRepository;

            yield* brokerageService.buy(
                cash.integrationId ?? 0,
                LISTING,
                { quantity: 21, price: 43.1471, fee: 25.157, operatedAt: TRADE_DAY },
                FUNDING_TITLE
            );
            yield* Effect.forEach(yield* fundingIds, id => transactionRepository.deleteById(id), { discard: true });
            const stackedId = yield* balanceAdjustmentService.create(cash.id, 570_000, justBefore(TRADE_DAY), FUNDING_TITLE);
            yield* testDb.$client.unsafe(
                `UPDATE transactions SET created_at = (SELECT MAX(created_at) FROM transaction_entries WHERE account_id = ${cash.id} AND type = '${TransactionEntryTypeEnum.FEE}') WHERE id = ${stackedId}`
            ).raw;
            yield* replayFundingMigration;
            expect(yield* fundingIds).toHaveLength(2);

            yield* brokerageService.reconcileFunding(FUNDING_TITLE);
            const repairedIds = yield* fundingIds;
            yield* brokerageService.reconcileFunding(FUNDING_TITLE);

            expect(yield* fundingIds).toEqual(repairedIds);
            expect(yield* fetchBalanceAdjustments(cash.id)).toEqual([
                { title: FUNDING_TITLE, amount: 931_250_000, type: TransactionEntryTypeEnum.DEBIT, operatedAt: justBefore(TRADE_DAY) }
            ]);
            expect(yield* fetchAccountBalance(cash.id)).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps an opening balance of a brokerage created outside the starting-balance release as user money', () =>
        Effect.gen(function* () {
            const { cash } = yield* createBrokerageWithBalance(800);

            yield* replayFundingMigration;

            expect(yield* fundingIds).toEqual([]);
            expect(yield* fetchAccountBalance(cash.id)).toBe(800_000_000);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([
        { name: 'no trade', tradeDay: null },
        { name: 'only a later trade', tradeDay: new Date(Date.now() + 86_400_000) }
    ])('keeps a legacy opening balance with $name as user money', ({ tradeDay }) =>
        Effect.gen(function* () {
            const { brokerageService, cash } = yield* createLegacyBrokerage;

            if (isDefined(tradeDay)) {
                yield* brokerageService.buy(cash.integrationId ?? 0, LISTING, buyTen(50, tradeDay), FUNDING_TITLE);
            }

            yield* replayFundingMigration;

            expect(yield* fundingIds).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps earlier funding deposits untouched when a later buy needs its own', () =>
        Effect.gen(function* () {
            const { brokerageService, cash } = yield* createBrokerage;

            yield* brokerageService.buy(cash.integrationId ?? 0, LISTING, buyTen(100, MARCH(2)), FUNDING_TITLE);
            const earlierIds = yield* fundingIds;
            yield* brokerageService.buy(cash.integrationId ?? 0, LISTING, buyTen(100, MARCH(11)), FUNDING_TITLE);

            expect(yield* fundingIds).toEqual([...earlierIds, expect.any(Number)]);
            expect(yield* fetchAccountBalance(cash.id)).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps a user deposit made at the same moment as a buy but saved separately', () =>
        Effect.gen(function* () {
            const { brokerageService, cash } = yield* createBrokerage;
            const balanceAdjustmentService = yield* BalanceAdjustmentService;
            const depositId = yield* balanceAdjustmentService.create(cash.id, 2_000_000_000, TRADE_DAY, 'Top up');

            yield* brokerageService.buy(cash.integrationId ?? 0, LISTING, buyTen(100, TRADE_DAY), FUNDING_TITLE);
            yield* testDb.$client.unsafe(`UPDATE transactions SET created_at = created_at - 100 WHERE id = ${depositId}`).raw;
            yield* replayFundingMigration;

            expect(yield* fundingIds).toEqual([]);
            expect(yield* fetchAccountBalance(cash.id)).toBe(1_000_000_000);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('hands a hand-edited funding deposit to the user and funds the remaining dip', () =>
        Effect.gen(function* () {
            const { brokerageService, cash } = yield* createBrokerage;
            const transactionService = yield* TransactionService;

            yield* brokerageService.buy(cash.integrationId ?? 0, LISTING, buyTen(100, MARCH(2)), FUNDING_TITLE);
            const [fundingId] = yield* fundingIds;
            yield* transactionService.updateById(fundingId, {
                type: TransactionTypeEnum.ADJUSTMENT,
                fromAccountId: null,
                toAccountId: cash.id,
                tagIds: [],
                entries: [{ accountId: cash.id, type: TransactionEntryTypeEnum.DEBIT, amount: 400, categoryId: null, mccCategoryId: null }]
            });
            yield* brokerageService.adoptFunding(fundingId, FUNDING_TITLE);

            expect(yield* fundingIds).not.toContain(fundingId);
            expect(yield* fetchBalanceAdjustments(cash.id)).toEqual(
                expect.arrayContaining([
                    { title: FUNDING_TITLE, amount: 400_000_000, type: TransactionEntryTypeEnum.DEBIT, operatedAt: justBefore(MARCH(2)) },
                    { title: FUNDING_TITLE, amount: 600_000_000, type: TransactionEntryTypeEnum.DEBIT, operatedAt: justBefore(MARCH(2)) }
                ])
            );
            expect(yield* fetchAccountBalance(cash.id)).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('funds an ordinary transfer out of brokerage cash', () =>
        Effect.gen(function* () {
            const { dollar, brokerageService, cash } = yield* createBrokerage;
            const bank = yield* seed.account({ title: 'Bank', instrumentId: dollar.id });

            yield* seed.directTransfer({
                exchangeRate: 1,
                operatedAt: MARCH(3),
                sourceAccountId: cash.id,
                sourceAmount: 50_000_000,
                sourceEntryExchangeRate: 1,
                targetAccountId: bank.id,
                targetAmount: 50_000_000,
                toIban: null
            });
            yield* brokerageService.reconcileFunding(FUNDING_TITLE);

            expect(yield* fetchBalanceAdjustments(cash.id)).toEqual([
                { title: FUNDING_TITLE, amount: 50_000_000, type: TransactionEntryTypeEnum.DEBIT, operatedAt: justBefore(MARCH(3)) }
            ]);
            expect(yield* fetchAccountBalance(cash.id)).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );
});
