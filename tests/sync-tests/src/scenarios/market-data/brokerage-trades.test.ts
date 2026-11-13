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
});
