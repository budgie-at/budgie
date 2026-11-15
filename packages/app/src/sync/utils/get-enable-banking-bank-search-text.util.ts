import { isDefined } from '@rnw-community/shared';

import { foldSearchText } from '../../@generic/utils/fold-search-text.util';
import { ENABLE_BANKING_COUNTRY_NAME } from '../constant/enable-banking-country-name.constant';

import type { EnableBankingBankInterface } from '@budgie/sync';
import type { MessageDescriptor } from '@lingui/core';

export const getEnableBankingBankSearchText = (
    bank: Pick<EnableBankingBankInterface, 'name' | 'country'>,
    translate: (descriptor: MessageDescriptor) => string
): string => {
    const countryName = ENABLE_BANKING_COUNTRY_NAME[bank.country.toUpperCase()];
    const countryLabel = isDefined(countryName) ? translate(countryName) : '';

    return foldSearchText(`${bank.name} ${bank.country} ${countryLabel}`);
};
