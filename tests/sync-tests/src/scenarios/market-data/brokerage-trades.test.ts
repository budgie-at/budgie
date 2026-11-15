import { BrokerageService } from '@app/brokerage/service/brokerage.service';
import { sumEntryAmounts } from '@app/transaction/utils/sum-entry-amounts.util';
import {
    AccountBalanceRepository,
    AccountRepository,
    ExternalSourceEnum,
    AccountTypeEnum,
    InstrumentTypeEnum,
    TransactionEntryEntityTable,
    TransactionEntryPositionRepository,
    TransactionEntryTypeEnum,
    UserIconNameEnum,
    convertFromMicroUnits
} from '@budgie/contracts';
import { BalanceAdjustmentService } from '@budgie/ledger';
import { calculateInstrumentPosition } from '@budgie/market';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import { HttpResponse, http } from 'msw';

import { fetchAccountBalance, fetchBalanceAdjustments, fetchExpenseEntries, requireInstrument, seed, TestLayer } from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';
import { testDb } from '../../harness/scenario/test-db';

const LISTING = { symbol: 'BGTX', name: 'Budgie Example Holdings', exchange: 'E2E Exchange', type: InstrumentTypeEnum.EQUITY } as const;
const TRADE_DAY = new Date('2026-03-02T12:00:00.000Z');
const FUNDING_TITLE = 'Deposit';
const WITHDRAWAL_TITLE = 'Withdrawal';
const MARCH = (day: number) => new Date(`2026-03-${String(day).padStart(2, '0')}T12:00:00.000Z`);

const findTradeIds = (securityId: number) =>
    Effect.map(testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.accountId, securityId)), entries =>
        entries.map(entry => entry.transactionId)
    );

const createBrokerage = Effect.gen(function* () {
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
        currentBalance: 0,
        includeInNetWorth: true,
        isActive: true
    });

    return { dollar, brokerageService, cash };
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

    yield* brokerage.brokerageService.sell(securityId, { quantity: 4, price: 125, fee: 0, operatedAt: MARCH(5) });

    const [buyId, sellId] = yield* findTradeIds(securityId);

    return { ...brokerage, securityId, buyId, sellId };
});

const buyTwoOnMarchEleventh = (brokerageService: Effect.Success<typeof createBrokerage>['brokerageService'], integrationId: number) =>
    brokerageService.buy(integrationId, LISTING, { quantity: 2, price: 100, fee: 0, operatedAt: MARCH(11) }, FUNDING_TITLE);

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
                yield* brokerageService.sell(securityId, { quantity: 11, price: 125, fee: 0, operatedAt: TRADE_DAY }).pipe(Effect.flip)
            ).toMatchObject({ _tag: 'InsufficientSecurityHoldingError' });
            expect(
                yield* brokerageService
                    .sell(securityId, { quantity: 1, price: 125, fee: 0, operatedAt: new Date('2026-03-01') })
                    .pipe(Effect.flip)
            ).toMatchObject({ _tag: 'InsufficientSecurityHoldingError' });
            expect(yield* fetchAccountBalance(securityId)).toBe(10_000_000);
            yield* brokerageService.sell(securityId, { quantity: 4, price: 125, fee: 0, operatedAt: TRADE_DAY });

            const security = yield* accountRepository.findById(securityId);
            const entries = yield* positionRepository.findInstrumentPositionEntries(security?.instrumentId ?? 0, dollar.id);

            expect(security).toMatchObject({ type: AccountTypeEnum.STOCKS, integrationId: cash.integrationId });
            expect(security?.instrument).toMatchObject({ type: InstrumentTypeEnum.EQUITY, symbol: 'BGTX', quoteInstrumentId: dollar.id });
            expect(yield* fetchAccountBalance(securityId)).toBe(6_000_000);
            expect(yield* fetchAccountBalance(cash.id)).toBe(500_000_000);
            expect(yield* fetchBalanceAdjustments(cash.id)).toEqual([
                { title: FUNDING_TITLE, amount: 1_005_000_000, type: TransactionEntryTypeEnum.DEBIT, operatedAt: TRADE_DAY }
            ]);
            expect(calculateInstrumentPosition(entries)).toEqual({
                amount: 6,
                costBasis: 603,
                averageCost: 100.5,
                realizedProfitLoss: 98
            });
            yield* brokerageService.sell(securityId, { quantity: 6, price: 125, fee: 0, operatedAt: new Date('2026-03-10') });
            expect(
                yield* brokerageService
                    .sell(securityId, { quantity: 1, price: 125, fee: 0, operatedAt: new Date('2026-03-05') })
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

            yield* brokerageService.sell(securityId, { quantity: 4, price: 125, fee: 3, operatedAt: TRADE_DAY });

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
                { title: FUNDING_TITLE, amount: 906_090_000 + 25_160_000, type: TransactionEntryTypeEnum.DEBIT, operatedAt: TRADE_DAY }
            ]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('deposits only the trade cost when the cash account goes negative later for an unrelated expense', () =>
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
                { title: FUNDING_TITLE, amount: 100_000_000, type: TransactionEntryTypeEnum.DEBIT, operatedAt: TRADE_DAY }
            ]);
            expect(yield* fetchAccountBalance(cash.id)).toBe(-50_000_000);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('edits a buy in place to the broker total so the cost basis matches and the cash stays funded', () =>
        Effect.gen(function* () {
            const { dollar, brokerageService, cash } = yield* createBrokerage;
            const accountRepository = yield* AccountRepository;
            const positionRepository = yield* TransactionEntryPositionRepository;
            const securityId = yield* brokerageService.buy(
                cash.integrationId ?? 0,
                LISTING,
                { quantity: 21, price: 37.8571, fee: 0, operatedAt: TRADE_DAY },
                FUNDING_TITLE
            );
            const [buyEntry] = yield* testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.accountId, securityId));

            yield* brokerageService.update(
                buyEntry.transactionId,
                { quantity: 21, price: 41.949, fee: 25.15, total: 906.08, operatedAt: TRADE_DAY },
                FUNDING_TITLE,
                WITHDRAWAL_TITLE
            );

            const security = yield* accountRepository.findById(securityId);
            const entries = yield* positionRepository.findInstrumentPositionEntries(security?.instrumentId ?? 0, dollar.id);
            const tradeEntries = yield* fetchExpenseEntries(buyEntry.transactionId);

            expect(calculateInstrumentPosition(entries)).toMatchObject({ amount: 21, costBasis: 906.08 });
            expect(tradeEntries.map(({ accountId, type, amount }) => ({ accountId, type, amount }))).toEqual(
                expect.arrayContaining([
                    { accountId: cash.id, type: TransactionEntryTypeEnum.CREDIT, amount: 880_930_000 },
                    { accountId: cash.id, type: TransactionEntryTypeEnum.FEE, amount: 25_150_000 },
                    { accountId: securityId, type: TransactionEntryTypeEnum.DEBIT, amount: 21_000_000 }
                ])
            );
            expect(yield* fetchAccountBalance(securityId)).toBe(21_000_000);
            expect(yield* fetchAccountBalance(cash.id)).toBe(0);

            yield* brokerageService.sell(securityId, { quantity: 10, price: 50, fee: 0, operatedAt: new Date('2026-03-10') });
            expect(
                yield* brokerageService
                    .update(
                        buyEntry.transactionId,
                        { quantity: 5, price: 40, fee: 0, operatedAt: TRADE_DAY },
                        FUNDING_TITLE,
                        WITHDRAWAL_TITLE
                    )
                    .pipe(Effect.flip)
            ).toMatchObject({ _tag: 'InsufficientSecurityHoldingError' });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rejects an edited date that leaves the holding negative in between', () =>
        Effect.gen(function* () {
            const { brokerageService, securityId, buyId, sellId } = yield* createTradedBrokerage;

            expect(
                yield* brokerageService
                    .update(buyId, { quantity: 10, price: 100, fee: 0, operatedAt: MARCH(8) }, FUNDING_TITLE, WITHDRAWAL_TITLE)
                    .pipe(Effect.flip)
            ).toMatchObject({ _tag: 'InsufficientSecurityHoldingError' });
            expect(
                yield* brokerageService
                    .update(sellId, { quantity: 4, price: 125, fee: 0, operatedAt: MARCH(1) }, FUNDING_TITLE, WITHDRAWAL_TITLE)
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

            yield* brokerageService.update(buyId, buyTen(10, MARCH(1)), FUNDING_TITLE, WITHDRAWAL_TITLE);

            expect(yield* fetchAccountBalance(cash.id)).toBe(cashBefore);
            expect(yield* balances.getMinimumLedgerBalanceFrom(cash.id, new Date('2026-02-28'))).toBeGreaterThanOrEqual(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the extra funding of a buy moved earlier and raised across an existing dip', () =>
        Effect.gen(function* () {
            const { brokerageService, cash } = yield* createBrokerage;
            const balanceAdjustmentService = yield* BalanceAdjustmentService;
            const securityId = yield* brokerageService.buy(cash.integrationId ?? 0, LISTING, buyTen(10, MARCH(2)), FUNDING_TITLE);
            const [buyId] = yield* findTradeIds(securityId);

            yield* seed.manualExpense({ accountId: cash.id, amount: 50_000_000, operatedAt: new Date('2026-03-01T18:00:00.000Z') });
            yield* balanceAdjustmentService.create(cash.id, 50_000_000, new Date('2026-03-01T20:00:00.000Z'), 'Refill');
            yield* brokerageService.update(buyId, buyTen(15, MARCH(1)), FUNDING_TITLE, WITHDRAWAL_TITLE);

            expect(yield* fetchAccountBalance(cash.id)).toBe(0);
            expect(yield* fetchBalanceAdjustments(cash.id)).toEqual(
                expect.arrayContaining([
                    { title: WITHDRAWAL_TITLE, amount: 100_000_000, type: TransactionEntryTypeEnum.CREDIT, operatedAt: MARCH(2) }
                ])
            );
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the cash funded between the dates when a sell moves later', () =>
        Effect.gen(function* () {
            const { brokerageService, cash, sellId } = yield* createTradedBrokerage;
            const balances = yield* AccountBalanceRepository;

            yield* buyTwoOnMarchEleventh(brokerageService, cash.integrationId ?? 0);
            const cashBefore = yield* fetchAccountBalance(cash.id);

            yield* brokerageService.update(
                sellId,
                { quantity: 4, price: 125, fee: 0, operatedAt: MARCH(20) },
                FUNDING_TITLE,
                WITHDRAWAL_TITLE
            );

            expect(yield* fetchAccountBalance(cash.id)).toBe(cashBefore);
            expect(yield* balances.getMinimumLedgerBalanceFrom(cash.id, MARCH(2))).toBeGreaterThanOrEqual(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('funds a later buy when an edited sell receives less', () =>
        Effect.gen(function* () {
            const { brokerageService, cash, sellId } = yield* createTradedBrokerage;
            const balances = yield* AccountBalanceRepository;

            yield* buyTwoOnMarchEleventh(brokerageService, cash.integrationId ?? 0);
            yield* brokerageService.update(
                sellId,
                { quantity: 4, price: 25, fee: 0, total: 100, operatedAt: MARCH(5) },
                FUNDING_TITLE,
                WITHDRAWAL_TITLE
            );

            expect(yield* balances.getMinimumLedgerBalanceFrom(cash.id, MARCH(2))).toBe(0);
            expect(yield* fetchBalanceAdjustments(cash.id)).toEqual(
                expect.arrayContaining([
                    {
                        title: FUNDING_TITLE,
                        amount: 100_000_000,
                        type: TransactionEntryTypeEnum.DEBIT,
                        operatedAt: new Date('2026-03-05T11:59:59.000Z')
                    }
                ])
            );
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('edits a trade funded from a non-brokerage account without inventing a deposit', () =>
        Effect.gen(function* () {
            const { dollar, brokerageService, cash } = yield* createBrokerage;
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

            yield* brokerageService.update(
                transfer.id,
                { quantity: 5, price: 120, fee: 0, total: 600, operatedAt: MARCH(3) },
                FUNDING_TITLE,
                WITHDRAWAL_TITLE
            );

            expect(yield* fetchBalanceAdjustments(bank.id)).toEqual([]);
            expect(yield* fetchBalanceAdjustments(cash.id)).toHaveLength(1);
            expect(yield* fetchAccountBalance(bank.id)).toBe(-600_000_000);
        }).pipe(Effect.provide(TestLayer))
    );
});
