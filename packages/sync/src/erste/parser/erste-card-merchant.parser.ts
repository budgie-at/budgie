import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { ERSTE_ISO_NUMERIC_TO_ALPHA2 } from '../constant/erste-iso-numeric-country.constant';

import type { ErsteCardMerchantInterface } from '../interface/erste-card-merchant.interface';

const COUNTRY_NUMERIC_REGEX = /^\d{3}$/u;
const POSTAL_TOKEN_REGEX = /^[A-Za-z0-9]{1,6}$/u;
const POSTAL_GLUE_LETTERS_REGEX = /^[A-Za-z]{1,2}$/u;
const POSTAL_DIGIT_REGEX = /\d/u;
const CITY_TOKEN_REGEX = /^[A-Za-zÄÖÜßäöü.-]+$/u;
const MAX_POSTAL_TOKENS = 3;

const findPostalStartIndex = (tokens: string[]): number => {
    let postalStartIndex = tokens.length - 1;
    const peelLimit = Math.min(MAX_POSTAL_TOKENS, tokens.length - 2);

    for (let offset = 1; offset <= peelLimit; offset += 1) {
        const candidate = tokens[tokens.length - 1 - offset];
        const isPostalToken =
            POSTAL_TOKEN_REGEX.test(candidate) && (POSTAL_DIGIT_REGEX.test(candidate) || POSTAL_GLUE_LETTERS_REGEX.test(candidate));

        if (!isPostalToken) {
            break;
        }

        postalStartIndex = tokens.length - 1 - offset;
    }

    return postalStartIndex;
};

const findCityStartIndex = (tokens: string[]): number | null => {
    const postalStartIndex = findPostalStartIndex(tokens);
    const cityStartIndex = postalStartIndex - 1;

    if (postalStartIndex === tokens.length - 1 || cityStartIndex < 1 || !CITY_TOKEN_REGEX.test(tokens[cityStartIndex])) {
        return null;
    }

    return cityStartIndex;
};

export const parseErsteCardMerchant = (line: string): ErsteCardMerchantInterface | null => {
    const tokens = line.trim().split(/\s+/u);
    const countryNumeric = tokens.at(-1);

    if (tokens.length < 3 || !isNotEmptyString(countryNumeric) || !COUNTRY_NUMERIC_REGEX.test(countryNumeric)) {
        return null;
    }

    const cityStartIndex = findCityStartIndex(tokens);

    if (!isDefined(cityStartIndex)) {
        return null;
    }

    const merchant = tokens.slice(0, cityStartIndex).join(' ').trim();
    const city = tokens[cityStartIndex];

    if (!isNotEmptyString(merchant) || !isNotEmptyString(city)) {
        return null;
    }

    return { city, countryAlpha2: ERSTE_ISO_NUMERIC_TO_ALPHA2[countryNumeric] ?? null };
};
