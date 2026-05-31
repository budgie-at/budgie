import { AccountEntityInterface } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { AccountVisibilityStatusEnum } from '../enum/account-visibility-status.enum';

export const getAccountVisibilityStatus = (
    account: Pick<AccountEntityInterface, 'isActive' | 'deletedAt'>
): AccountVisibilityStatusEnum => {
    if (isDefined(account.deletedAt)) {
        return AccountVisibilityStatusEnum.ARCHIVED;
    }

    if (!account.isActive) {
        return AccountVisibilityStatusEnum.INACTIVE;
    }

    return AccountVisibilityStatusEnum.ACTIVE;
};
