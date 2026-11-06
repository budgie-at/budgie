import { isNotEmptyString } from '@rnw-community/shared';

const LEGACY_STOP_TOKENS = new Set('GMBH AG KG CO INC LTD LLC OG ФОП ТОВ ПП ПАТ АТ ВІД'.split(' '));

export const IDENTITY_TOKEN_SEPARATOR = /[^\p{L}\p{N}]+/u;

export const DISPLAY_TOKEN_SEPARATOR = /(?:[^\p{L}\p{N}'’]|(?<![\p{L}\p{N}])['’]|['’](?![\p{L}\p{N}]))+/u;

export const cleanDescriptionTokens = (text: string, referenceTail: RegExp, numericToken: RegExp, separator: RegExp): string[] =>
    text
        .replace(referenceTail, '')
        .replaceAll(/\bGES\.?\s*M\.?\s*B\.?\s*H\.?/giu, ' ')
        .split(separator)
        .filter(token => isNotEmptyString(token) && !numericToken.test(token) && !LEGACY_STOP_TOKENS.has(token.toUpperCase()));
