import { AccountTypeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { seed } from './seed';

export const seedAccountPair = (fromIban: string | null = null, toIban: string | null = null) =>
    Effect.gen(function* () {
        return {
            fromAccount: yield* seed.account({ externalId: 'mono-from', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1, iban: fromIban }),
            toAccount: yield* seed.account({ externalId: 'mono-to', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1, iban: toIban })
        };
    });
