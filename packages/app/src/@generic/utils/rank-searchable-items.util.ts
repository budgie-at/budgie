import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

const COMBINING_MARK_REGEX = /\p{Diacritic}/gu;
const MIN_FUZZY_TOKEN_LENGTH = 4;
const SEARCH_TOKEN_SEPARATOR = /\s+/u;

const normalizeSearchValue = (value: string) => value.normalize('NFKD').replace(COMBINING_MARK_REGEX, '').toLowerCase().trim();

const getSearchTokens = (search: string) => normalizeSearchValue(search).split(SEARCH_TOKEN_SEPARATOR).filter(isNotEmptyString);

const isFuzzyMatch = (value: string, token: string) => {
    if (token.length < MIN_FUZZY_TOKEN_LENGTH) {
        return false;
    }

    let valueIndex = 0;

    for (const tokenCharacter of token) {
        const matchedIndex = value.indexOf(tokenCharacter, valueIndex);
        if (matchedIndex < 0) {
            return false;
        }

        valueIndex = matchedIndex + 1;
    }

    return true;
};

const getSearchValueScore = (value: string, token: string) => {
    const normalizedValue = normalizeSearchValue(value);

    if (normalizedValue === token) {
        return 100;
    }

    if (normalizedValue.startsWith(token)) {
        return 70;
    }

    if (normalizedValue.includes(token)) {
        return 40;
    }

    if (isFuzzyMatch(normalizedValue, token)) {
        return 10;
    }

    return 0;
};

const getSearchScore = (values: readonly string[], tokens: readonly string[]) => {
    let score = 0;

    for (const token of tokens) {
        const tokenScore = Math.max(...values.map(value => getSearchValueScore(value, token)));

        if (!isPositiveNumber(tokenScore)) {
            return 0;
        }

        score += tokenScore;
    }

    return score;
};

export const rankSearchableItems = <T>(items: T[] | null, search: string, getSearchValues: (item: T) => readonly string[]) => {
    if (!isDefined(items)) {
        return items;
    }

    const tokens = getSearchTokens(search);

    if (!isNotEmptyArray(tokens)) {
        return items;
    }

    return items
        .map((item, index) => ({ item, index, score: getSearchScore(getSearchValues(item), tokens) }))
        .filter(({ score }) => isPositiveNumber(score))
        .sort((left, right) => right.score - left.score || left.index - right.index)
        .map(({ item }) => item);
};
