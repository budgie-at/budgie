import { ExchangeRatesService } from '@app/exchange-rate/service/exchange-rates.service';
import { CurrencyEnum, PRECISION, SettingsEntityTable } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { requireInstrument, seedExchangeRate, TestLayer } from '../../harness';
import { testDb } from '../../harness/scenario/setup';

describe('bridged currency conversion', () => {
    it.effect('returns a composed rate such that amount equals source divided by rate', () =>
        Effect.gen(function* () {
            const exchangeRatesService = yield* ExchangeRatesService;
            const dollar = yield* requireInstrument(CurrencyEnum.USD);
            const zloty = yield* requireInstrument(CurrencyEnum.PLN);
            const koruna = yield* requireInstrument(CurrencyEnum.CZK);

            testDb.update(SettingsEntityTable).set({ defaultInstrumentId: dollar.id }).run();
            seedExchangeRate(dollar.id, zloty.id, 4);
            seedExchangeRate(koruna.id, dollar.id, 0.04);

            const sourceAmount = 100 * PRECISION;
            const conversion = yield* exchangeRatesService.convert(zloty.id, koruna.id, sourceAmount);

            expect(conversion.exchangeRate).toBeCloseTo(0.16, 10);
            expect(conversion.amount).toBe(625 * PRECISION);
            expect(Math.round(sourceAmount / conversion.exchangeRate)).toBe(conversion.amount);
        }).pipe(Effect.provide(TestLayer))
    );
});
