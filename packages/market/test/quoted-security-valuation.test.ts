import {
    AccountBalanceRepository,
    AccountTypeEnum,
    Db,
    InstrumentRepository,
    InstrumentTypeEnum,
    getExchangeRateWithHistoricalFallbackSql
} from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import { sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { HistoricalExchangeRateRepository } from '../src/historical-exchange-rate/repository/historical-exchange-rate.repository';
import { EntryBaseValuationService } from '../src/valuation/service/entry-base-valuation.service';

import { TestLayer, setDefaultInstrument, testSeedService } from './test-context';

it.effect('values EUR security quotes with fiat history delivered later and switches base without rewriting security rates', () =>
    Effect.gen(function* () {
        const instruments = yield* InstrumentRepository;
        const history = yield* HistoricalExchangeRateRepository;
        const valuation = yield* EntryBaseValuationService;
        const balances = yield* AccountBalanceRepository;
        const euro = yield* Effect.flatMap(instruments.findByCode('EUR'), Effect.fromNullishOr);
        const dollar = yield* Effect.flatMap(instruments.findByCode('USD'), Effect.fromNullishOr);
        const security = yield* instruments.create({
            code: 'YAHOO:LATER',
            name: 'Late fiat',
            symbol: 'LATER',
            type: InstrumentTypeEnum.EQUITY,
            quoteInstrumentId: euro.id
        });
        const account = yield* testSeedService.account({ instrumentId: security.id, type: AccountTypeEnum.STOCKS });
        yield* balances.upsert({ accountId: account.id, amount: 2_000_000 });
        yield* history.bulkUpsert([{ sourceInstrumentId: security.id, targetInstrumentId: euro.id, rateDate: '2099-01-01', rate: 100 }]);
        yield* setDefaultInstrument(dollar.id);
        yield* history.bulkUpsert([{ sourceInstrumentId: dollar.id, targetInstrumentId: euro.id, rateDate: '2099-01-01', rate: 0.5 }]);
        expect(yield* valuation.resolveHistoricalBaseExchangeRateOrNull(security.id, dollar.id, new Date('2099-01-01'))).toBe(200);
        expect(
            yield* Db.query(db =>
                db.get<{ rate: number }>(sql`SELECT ${getExchangeRateWithHistoricalFallbackSql(dollar.id, security.id)} AS rate`)
            )
        ).toEqual({ rate: 200 });
        expect(yield* balances.getNetWorth(dollar.id)).toEqual([{ netWorth: 400_000_000 }]);
        yield* setDefaultInstrument(euro.id);
        expect(yield* valuation.resolveHistoricalBaseExchangeRateOrNull(security.id, euro.id, new Date('2099-01-01'))).toBe(100);
        expect(
            yield* Db.query(db =>
                db.get<{ rate: number }>(sql`SELECT ${getExchangeRateWithHistoricalFallbackSql(euro.id, security.id)} AS rate`)
            )
        ).toEqual({ rate: 100 });
        expect(yield* balances.getNetWorth(euro.id)).toEqual([{ netWorth: 200_000_000 }]);
    }).pipe(Effect.provide([TestLayer, AccountBalanceRepository.layer]))
);
