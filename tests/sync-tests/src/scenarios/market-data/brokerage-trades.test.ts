import { BrokerageService } from '@app/brokerage/service/brokerage.service';
import {
    AccountRepository,
    AccountTypeEnum,
    InstrumentTypeEnum,
    TransactionEntryPositionRepository,
    UserIconNameEnum
} from '@budgie/contracts';
import { calculateInstrumentPosition } from '@budgie/market';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import { HttpResponse, http } from 'msw';

import { fetchAccountBalance, requireInstrument, TestLayer } from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

const LISTING = { symbol: 'BGTX', name: 'Budgie Example Holdings', exchange: 'E2E Exchange', type: InstrumentTypeEnum.EQUITY } as const;
const TRADE_DAY = new Date('2026-03-02T12:00:00.000Z');

describe('market-data/brokerage-trades', () => {
    it.effect('buys and partly sells a security against brokerage cash with FIFO cost and realized return', () =>
        Effect.gen(function* () {
            mockServer.use(
                http.get('https://query1.finance.yahoo.com/v8/finance/chart/:symbol', () =>
                    HttpResponse.json({ chart: { result: [{ meta: { currency: 'USD' }, indicators: { quote: [{ close: [] }] } }] } })
                )
            );
            const dollar = yield* requireInstrument('USD');
            const brokerageService = yield* BrokerageService;
            const accountRepository = yield* AccountRepository;
            const positionRepository = yield* TransactionEntryPositionRepository;
            const cash = yield* brokerageService.create({
                title: 'Broker',
                type: AccountTypeEnum.STOCKS,
                icon: UserIconNameEnum.ChartLine,
                instrumentId: dollar.id,
                currentBalance: 2000,
                includeInNetWorth: true,
                isActive: true
            });

            const securityId = yield* brokerageService.buy(cash.integrationId ?? 0, LISTING, 'BGTX', {
                quantity: 10,
                price: 100,
                fee: 5,
                operatedAt: TRADE_DAY
            });
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
            expect(yield* fetchAccountBalance(cash.id)).toBe(1_495_000_000);
            expect(calculateInstrumentPosition(entries)).toEqual({
                amount: 6,
                costBasis: 603,
                averageCost: 100.5,
                realizedProfitLoss: 98
            });
        }).pipe(Effect.provide(TestLayer))
    );
});
