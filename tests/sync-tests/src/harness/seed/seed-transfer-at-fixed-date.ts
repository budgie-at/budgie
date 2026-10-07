import * as Effect from 'effect/Effect';

import { seed } from './seed';

export const FIXED_TRANSFER_OPERATED_AT = new Date(2025, 5, 1, 12, 0, 0);

export const seedTransferAtFixedDate = (sourceAccountId: number, targetAccountId: number, amount: number) =>
    Effect.suspend(() =>
        seed.directTransfer({
            exchangeRate: 1,
            operatedAt: FIXED_TRANSFER_OPERATED_AT,
            sourceAccountId,
            sourceAmount: amount,
            sourceEntryExchangeRate: 1,
            targetAccountId,
            targetAmount: amount,
            toIban: null
        })
    );
