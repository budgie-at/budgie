import { describe, expect, it } from 'vitest';

import {
    AccountBalanceEntityTable,
    AccountTypeEnum,
    CurrencyEnum,
    ExchangeRateEntityTable,
    PRECISION,
    SettingsEntityTable
} from '@budgie/contracts';
import { accountBalanceRepository } from '@app/@generic/drizzle/db/db';

import { requireInstrument } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

describe('net worth currency conversion', () => {
    it('converts a foreign balance using the live rate when present', async () => {
        const euro = await seedHryvniaCashWithBalance(1000 * PRECISION);
        const hryvnia = await requireInstrument(CurrencyEnum.UAH);

        insertOne(ExchangeRateEntityTable, { source: 'test', baseInstrumentId: hryvnia.id, quoteInstrumentId: euro.id, rate: 0.02 });

        const netWorth = accountBalanceRepository.getNetWorth(euro.id).get();

        expect(netWorth?.netWorth).toBe(20 * PRECISION);
    });

    it('falls back to the historical rate instead of 1:1 when no live rate exists', async () => {
        const euro = await seedHryvniaCashWithBalance(1000 * PRECISION);

        const netWorth = accountBalanceRepository.getNetWorth(euro.id).get();
        const cashTotal = accountBalanceRepository.getTotalByAccountType(euro.id, AccountTypeEnum.CASH).get();

        expect(netWorth?.netWorth).toBeLessThan(50 * PRECISION);
        expect(netWorth?.netWorth).toBeGreaterThan(5 * PRECISION);
        expect(cashTotal?.total).toBe(netWorth?.netWorth);
    });
});

const seedHryvniaCashWithBalance = async (balance: number) => {
    const euro = await requireInstrument(CurrencyEnum.EUR);
    const hryvnia = await requireInstrument(CurrencyEnum.UAH);
    const account = seed.account({ instrumentId: hryvnia.id, type: AccountTypeEnum.CASH });

    await testDb.update(SettingsEntityTable).set({ defaultInstrumentId: euro.id });
    insertOne(AccountBalanceEntityTable, { accountId: account.id, amount: balance });

    return euro;
};
