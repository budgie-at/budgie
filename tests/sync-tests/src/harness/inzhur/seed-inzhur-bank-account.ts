import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';

import { seed } from '../seed/seed';

const UAH_INSTRUMENT_ID = 1;

export const seedInzhurBankAccount = seed.account({
    title: 'Monobank Card',
    externalId: 'inzhur-test-card',
    externalSource: ExternalSourceEnum.MONOBANK,
    type: AccountTypeEnum.BANK_SYNC,
    instrumentId: UAH_INSTRUMENT_ID
});
