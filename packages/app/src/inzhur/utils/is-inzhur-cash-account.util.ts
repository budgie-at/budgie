import { ExternalSourceEnum } from '@budgie/contracts';
import { INZHUR_CASH_EXTERNAL_ID } from '@budgie/sync';

import type { AccountEntityInterface } from '@budgie/contracts';

export const isInzhurCashAccount = (account: Pick<AccountEntityInterface, 'externalSource' | 'externalId'>): boolean =>
    account.externalSource === ExternalSourceEnum.INZHUR && account.externalId === INZHUR_CASH_EXTERNAL_ID;
