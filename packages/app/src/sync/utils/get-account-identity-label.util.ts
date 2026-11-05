import { isNotEmptyString } from '@rnw-community/shared';

export const getAccountIdentityLabel = (currencyCode: string, iban: string | null): string =>
    isNotEmptyString(iban) ? `${currencyCode} · ••${iban.replaceAll(/\s/gu, '').slice(-4)}` : currencyCode;
