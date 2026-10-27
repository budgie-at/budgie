import { isNotEmptyString } from '@rnw-community/shared';

export const getAccountIdentityLabel = (currencyCode: string, iban: string | null): string =>
    isNotEmptyString(iban) ? `${currencyCode} · ••${iban.slice(-4)}` : currencyCode;
