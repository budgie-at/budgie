import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';
import { msg, plural } from '@lingui/core/macro';

import { isDefined } from '@rnw-community/shared';

import { getSinglePositionName } from './get-single-position-name.util';
import { isFiatAccount } from './is-fiat-account.util';

import type { InstitutionGroupInterface } from '../interface/institution-group.interface';
import type { MessageDescriptor } from '@lingui/core';

export const getInstitutionRowCaption = (
    t: (descriptor: MessageDescriptor) => string,
    institution: Pick<InstitutionGroupInterface, 'provider' | 'accounts' | 'isHoldingProvider'>,
    investedLabel: string
): string => {
    const { provider, accounts, isHoldingProvider } = institution;
    const positionsCount = accounts.filter(account => !isFiatAccount(account)).length;
    const positionName = getSinglePositionName(accounts);

    if (isHoldingProvider && isDefined(positionName)) {
        return t(msg`${investedLabel} in ${positionName}`);
    }

    if (isHoldingProvider && provider === ExternalSourceEnum.MANUAL) {
        return t(
            msg({ message: plural(positionsCount, { one: `${investedLabel} in # position`, other: `${investedLabel} in # positions` }) })
        );
    }

    if (isHoldingProvider) {
        return t(msg({ message: plural(positionsCount, { one: `${investedLabel} in # asset`, other: `${investedLabel} in # assets` }) }));
    }

    return accounts.every(account => account.type === AccountTypeEnum.CRYPTO_SYNC)
        ? t(msg({ message: plural(accounts.length, { one: '# asset', other: '# assets' }) }))
        : t(msg({ message: plural(accounts.length, { one: '# account', other: '# accounts' }) }));
};
