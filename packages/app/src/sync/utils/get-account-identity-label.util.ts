import { isNotEmptyString } from '@rnw-community/shared';

import { getAccountMaskLabel } from './get-account-mask-label.util';

export const getAccountIdentityLabel = (currencyCode: string, iban: string | null): string =>
    isNotEmptyString(iban) ? `${currencyCode} · ${getAccountMaskLabel(iban)}` : currencyCode;
