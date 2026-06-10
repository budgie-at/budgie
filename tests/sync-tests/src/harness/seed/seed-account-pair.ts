import { AccountTypeEnum } from '@budgie/contracts';

import { seed } from './seed';

export const seedAccountPair = (fromIban: string | null = null, toIban: string | null = null) => ({
    fromAccount: seed.account({ externalId: 'mono-from', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1, iban: fromIban }),
    toAccount: seed.account({ externalId: 'mono-to', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1, iban: toIban })
});
