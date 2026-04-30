import { Log } from '@budgie/logger';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { ERSTE_ISO_NUMERIC_TO_ALPHA2 } from '../constant/erste-iso-numeric-country.constant';

import type { ErsteCardMerchantInterface } from '../interface/erste-card-merchant.interface';

class ErsteCardMerchantParser {
    private static readonly COUNTRY_NUMERIC_REGEX = /^\d{3}$/u;
    private static readonly POSTAL_TOKEN_REGEX = /^[A-Za-z0-9]{1,6}$/u;
    private static readonly POSTAL_GLUE_LETTERS_REGEX = /^[A-Za-z]{1,2}$/u;
    private static readonly POSTAL_DIGIT_REGEX = /\d/u;
    private static readonly CITY_TOKEN_REGEX = /^[A-Za-zÄÖÜßäöü.-]+$/u;
    private static readonly MAX_POSTAL_TOKENS = 3;

    @Log(
        line => `enter line="${line}"`,
        (result, line) =>
            `done line="${line}" merchant=${result?.merchant ?? 'null'} city=${result?.city ?? 'null'} countryAlpha2=${result?.countryAlpha2 ?? 'null'}`,
        (error, line) => `throw line="${line}" error=${getErrorMessage(error)}`
    )
    parse(line: string): ErsteCardMerchantInterface | null {
        const tokens = line.trim().split(/\s+/u);
        const countryNumeric = tokens.at(-1);

        if (
            tokens.length < 3 ||
            !isNotEmptyString(countryNumeric) ||
            !ErsteCardMerchantParser.COUNTRY_NUMERIC_REGEX.test(countryNumeric)
        ) {
            return null;
        }

        const cityStartIndex = this.findCityStartIndex(tokens);

        if (cityStartIndex === null) {
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
    }

    private findCityStartIndex(tokens: string[]): number | null {
        const postalStartIndex = this.findPostalStartIndex(tokens);

        if (postalStartIndex === tokens.length - 1) {
            return null;
        }

        const cityStartIndex = postalStartIndex - 1;

        if (cityStartIndex < 1 || !ErsteCardMerchantParser.CITY_TOKEN_REGEX.test(tokens[cityStartIndex])) {
            return null;
        }

        return cityStartIndex;
    }

    private findPostalStartIndex(tokens: string[]): number {
        let postalStartIndex = tokens.length - 1;
        const peelLimit = Math.min(ErsteCardMerchantParser.MAX_POSTAL_TOKENS, tokens.length - 2);

        for (let offset = 1; offset <= peelLimit; offset += 1) {
            const candidate = tokens[tokens.length - 1 - offset];

            if (!ErsteCardMerchantParser.POSTAL_TOKEN_REGEX.test(candidate)) {
                break;
            }

            const containsDigit = ErsteCardMerchantParser.POSTAL_DIGIT_REGEX.test(candidate);
            const isShortAlpha = ErsteCardMerchantParser.POSTAL_GLUE_LETTERS_REGEX.test(candidate);

            if (!containsDigit && !isShortAlpha) {
                break;
            }

            postalStartIndex = tokens.length - 1 - offset;
        }

        return postalStartIndex;
    }
}

export const ersteCardMerchantParser = new ErsteCardMerchantParser();
