import { ExchangeRateCreateEntityInterface, ExchangeRateEntityTable } from '@budgie/contracts';

import { testDb } from '../scenario/setup';

export const seedExchangeRate = (baseInstrumentId: number, quoteInstrumentId: number, rate: number): void => {
    testDb
        .insert(ExchangeRateEntityTable)
        .values({ source: 'test', baseInstrumentId, quoteInstrumentId, rate } satisfies ExchangeRateCreateEntityInterface)
        .run();
};
