import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';

import type { AccountEntityInterface } from '@budgie/contracts';

export const isInzhurFundAccount = (account: Pick<AccountEntityInterface, 'type' | 'externalSource'>): boolean =>
    account.type === AccountTypeEnum.STOCKS && account.externalSource === ExternalSourceEnum.INZHUR;
