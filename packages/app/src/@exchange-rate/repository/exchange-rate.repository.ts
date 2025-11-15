import { ExchangeRateRepository } from '@budgie/contracts';

import { db } from '../../drizzle/db/db';

export const exchangeRateRepository = new ExchangeRateRepository(db);
