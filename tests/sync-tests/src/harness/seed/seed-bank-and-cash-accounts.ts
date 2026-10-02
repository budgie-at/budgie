import { AccountTypeEnum } from '@budgie/contracts';

import { seed } from './seed';

export const seedBankAndCashAccounts = () => ({
    bankAccount: seed.account({ externalId: 'mono-bank', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 }),
    cashAccount: seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: 1 })
});
