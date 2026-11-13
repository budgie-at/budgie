import { AccountTypeEnum } from '@budgie/contracts';
import { msg, plural } from '@lingui/core/macro';

import { isDefined } from '@rnw-community/shared';

import type { AccountEntityInterface } from '@budgie/contracts';
import type { MessageDescriptor } from '@lingui/core';

export const getHoldingPlacesLabel = (
    t: (descriptor: MessageDescriptor) => string,
    accounts: readonly Pick<AccountEntityInterface, 'type' | 'integrationId'>[]
): string => {
    const placesCount = accounts.length;

    if (accounts.every(account => account.type === AccountTypeEnum.CRYPTO)) {
        return t(msg({ message: plural(placesCount, { one: '# wallet', other: '# wallets' }) }));
    }

    if (accounts.every(account => account.type === AccountTypeEnum.STOCKS && isDefined(account.integrationId))) {
        return t(msg({ message: plural(placesCount, { one: '# broker', other: '# brokers' }) }));
    }

    return t(msg({ message: plural(placesCount, { one: '# account', other: '# accounts' }) }));
};
