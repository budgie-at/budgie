import { exchangeRatesService } from '@app/exchange-rate/service/exchange-rates.service';
import { CurrencyEnum, PRECISION, SettingsEntityTable } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { requireInstrument, run, seedExchangeRate } from '../../harness';
import { testDb } from '../../harness/scenario/setup';

describe('bridged currency conversion', () => {
    it('returns a composed rate such that amount equals source divided by rate', async () => {
        const dollar = await requireInstrument(CurrencyEnum.USD);
        const zloty = await requireInstrument(CurrencyEnum.PLN);
        const koruna = await requireInstrument(CurrencyEnum.CZK);

        await testDb.update(SettingsEntityTable).set({ defaultInstrumentId: dollar.id });
        seedExchangeRate(dollar.id, zloty.id, 4);
        seedExchangeRate(koruna.id, dollar.id, 0.04);

        const sourceAmount = 100 * PRECISION;
        const conversion = await run(exchangeRatesService.convert(zloty.id, koruna.id, sourceAmount));

        expect(conversion.exchangeRate).toBeCloseTo(0.16, 10);
        expect(conversion.amount).toBe(625 * PRECISION);
        expect(Math.round(sourceAmount / conversion.exchangeRate)).toBe(conversion.amount);
    });
});
