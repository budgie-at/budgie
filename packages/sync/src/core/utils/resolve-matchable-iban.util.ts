import { isNotEmptyString } from '@rnw-community/shared';

const IBAN_CHECK_DIGITS_START = 2;
const IBAN_CHECK_DIGITS_END = 4;
const IBAN_MIN_VALID_CHECK_DIGITS = 2;
const IBAN_MAX_VALID_CHECK_DIGITS = 98;

export const resolveMatchableIban = (iban: string | null | undefined): string | null => {
    if (!isNotEmptyString(iban)) {
        return null;
    }

    const checkDigits = Number(iban.slice(IBAN_CHECK_DIGITS_START, IBAN_CHECK_DIGITS_END));

    return checkDigits >= IBAN_MIN_VALID_CHECK_DIGITS && checkDigits <= IBAN_MAX_VALID_CHECK_DIGITS ? iban : null;
};
