import { isListedSecurityType } from '../../instrument/utils/is-listed-security-type.util';

import { isFiatAccount } from './is-fiat-account.util';

import type { AccountAssociationEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';

export const getSinglePositionName = (
    accounts: readonly Pick<AccountWithInstrumentEntityInterface, AccountAssociationEnum.INSTRUMENT>[]
): string | null => {
    const positions = accounts.filter(account => !isFiatAccount(account));

    if (positions.length !== 1) {
        return null;
    }

    const [{ instrument }] = positions;

    return isListedSecurityType(instrument.type) ? instrument.symbol : instrument.code;
};
