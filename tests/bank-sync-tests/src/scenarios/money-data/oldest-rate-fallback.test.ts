import { describe, expect, it } from 'vitest';

import { CurrencyEnum, PRECISION, SettingsEntityTable } from '@budgie/contracts';

import { entryBaseValuationService } from '@app/money-data/service/entry-base-valuation.service';

import { requireInstrument } from '../../harness';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

describe('valuation oldest-rate fallback', () => {
    it('values a transaction older than the seeded range using the oldest available historical rate', async () => {
        const euro = await requireInstrument(CurrencyEnum.EUR);
        const hryvnia = await requireInstrument(CurrencyEnum.UAH);
        const account = seed.account({ instrumentId: hryvnia.id });

        await testDb.update(SettingsEntityTable).set({ defaultInstrumentId: euro.id });

        const valuation = await entryBaseValuationService.valueMicroUnitEntry({
            accountId: account.id,
            amount: 50 * PRECISION,
            operatedAt: new Date('2009-01-01T12:00:00.000Z'),
            externalSource: null
        });

        expect(valuation).toStrictEqual({
            baseInstrumentId: euro.id,
            baseExchangeRate: 0.0889028367561666,
            baseAmount: 4_445_142
        });
    });
});
