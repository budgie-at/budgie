import { isFiatAccount } from './is-fiat-account.util';

import type { AccountWithSyncEntityInterface } from '@budgie/contracts';

export const countHoldingPositions = (
    accounts: readonly AccountWithSyncEntityInterface[],
    isShownInstrument: (instrumentId: number) => boolean
): number =>
    new Set(
        accounts
            .filter(account => !isFiatAccount(account) && isShownInstrument(account.instrument.id))
            .map(account => account.instrument.id)
    ).size;
