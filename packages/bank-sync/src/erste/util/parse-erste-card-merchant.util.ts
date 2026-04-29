import { isNotEmptyString } from '@rnw-community/shared';

import { ERSTE_ISO_NUMERIC_TO_ALPHA2 } from '../constant/erste-iso-numeric-country.constant';

import type { ErsteCardMerchantInterface } from '../interface/erste-card-merchant.interface';

const COUNTRY_NUMERIC_REGEX = /^\d{3}$/u;
const POSTAL_TOKEN_REGEX = /^[A-Za-z0-9]{1,6}$/u;
const POSTAL_GLUE_LETTERS_REGEX = /^[A-Za-z]{1,2}$/u;
const POSTAL_DIGIT_REGEX = /\d/u;
const CITY_TOKEN_REGEX = /^[A-Za-zÄÖÜßäöü.-]+$/u;
const MAX_POSTAL_TOKENS = 3;

export const parseErsteCardMerchant = (line: string): ErsteCardMerchantInterface | null => {
    const tokens = line.trim().split(/\s+/u);

    if (tokens.length < 3) {
        return null;
    }

    const countryNumeric = tokens[tokens.length - 1];

    if (!COUNTRY_NUMERIC_REGEX.test(countryNumeric)) {
        return null;
    }

    let postalStartIndex = tokens.length - 1;
    const peelLimit = Math.min(MAX_POSTAL_TOKENS, tokens.length - 2);

    for (let offset = 1; offset <= peelLimit; offset += 1) {
        const candidate = tokens[tokens.length - 1 - offset];

        if (!POSTAL_TOKEN_REGEX.test(candidate)) {
            break;
        }

        const containsDigit = POSTAL_DIGIT_REGEX.test(candidate);
        const isShortAlpha = POSTAL_GLUE_LETTERS_REGEX.test(candidate);

        if (!containsDigit && !isShortAlpha) {
            break;
        }

        postalStartIndex = tokens.length - 1 - offset;
    }

    if (postalStartIndex === tokens.length - 1) {
        return null;
    }

    const cityStartIndex = postalStartIndex - 1;

    if (cityStartIndex < 1 || !CITY_TOKEN_REGEX.test(tokens[cityStartIndex])) {
        return null;
    }

    const merchant = tokens.slice(0, cityStartIndex).join(' ').trim();
    const city = tokens[cityStartIndex];

    if (!isNotEmptyString(merchant) || !isNotEmptyString(city)) {
        return null;
    }

    return {
        merchant,
        city,
        countryAlpha2: ERSTE_ISO_NUMERIC_TO_ALPHA2[countryNumeric] ?? null,
        countryNumeric
    };
};
