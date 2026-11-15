import { PRECISION } from '@budgie/contracts';

import { seed } from './seed';

export const seedReward = (
    accountId: number,
    operatedAt: string,
    baseInstrumentId: number | null,
    baseExchangeRate: number | null,
    baseAmount: number | null
) =>
    seed.valuedIncome({
        accountId,
        amount: PRECISION,
        operatedAt: new Date(operatedAt),
        title: 'Reward',
        baseInstrumentId,
        baseExchangeRate,
        baseAmount
    });
