import { RuleConditionCreateInputInterface, RuleConditionFieldEnum, RuleConditionOperatorEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

const REFERENCE_PATTERNS = [/\bREF[#:]?\w*/giu, /#\w{4,}/gu, /\b\d{5,}\b/gu];

const AMOUNT_PATTERNS = [
    /\b(?:USD|EUR|GBP|UAH|CHF|CAD|AUD|JPY|PLN|CZK)\s*\d+[.,]?\d*/giu,
    /[$€£₴¥]\s*\d+[.,]?\d*/gu,
    /(?<!\d[.,])\b\d+[.,]\d{2}(?![.,]\d)\b/gu
];

const DATE_PATTERNS = [/\b\d{1,2}[/.]\d{1,2}([/.]\d{2,4})?\b/gu, /\b\d{4}-\d{2}-\d{2}\b/gu, /\b\d{2}-\d{2}-\d{4}\b/gu];

const SUFFIX_PATTERN = /\.?\b(?:COM|NET|ORG|INC|LLC|LTD|GMBH|CO|CORP|PLC|SA|AG|SRL|PTY)\b\.?/giu;

const EXTRA_WHITESPACE = /\s{2,}/gu;
const LEADING_TRAILING_SEPARATORS = /^[\s*\-_.,/]+|[\s*\-_.,/]+$/gu;
const REGEX_SPECIAL_CHARACTERS = /[\\^$.*+?()[\]{}|]/gu;
const TOKEN_SEPARATOR = /\s+/u;

const MINIMUM_CLEANED_LENGTH = 3;
const MAX_CONDITION_REGEX_LENGTH = 200;

// eslint-disable-next-line max-statements -- sequential regex cleanup steps absorbed from clean-merchant-title util per CLAUDE.md rule 38/51
const cleanMerchantTitle = (title: string): string => {
    let cleaned = title;

    for (const pattern of REFERENCE_PATTERNS) {
        cleaned = cleaned.replace(pattern, ' ');
    }

    for (const pattern of AMOUNT_PATTERNS) {
        cleaned = cleaned.replace(pattern, ' ');
    }

    for (const pattern of DATE_PATTERNS) {
        cleaned = cleaned.replace(pattern, ' ');
    }

    cleaned = cleaned.replace(SUFFIX_PATTERN, ' ');
    cleaned = cleaned.replace(EXTRA_WHITESPACE, ' ');
    cleaned = cleaned.replace(LEADING_TRAILING_SEPARATORS, '');

    if (cleaned.length < MINIMUM_CLEANED_LENGTH) {
        return title.trim();
    }

    return cleaned;
};

// eslint-disable-next-line lingui/no-unlocalized-strings
const GENERIC_TITLE_PATTERNS = ['POS PURCHASE', 'POS', 'PURCHASE', 'PAYMENT', 'WITHDRAWAL', 'TRANSFER', 'DEBIT', 'CREDIT', 'ATM'];

const MINIMUM_UNIQUE_WORDS = 3;
const MINIMUM_TITLE_LENGTH = 3;

const isGenericTitle = (title: string): boolean => {
    const upper = title.toUpperCase().trim();

    if (GENERIC_TITLE_PATTERNS.includes(upper)) {
        return true;
    }

    const uniqueWords = new Set(upper.split(/\s+/u).filter(isNotEmptyString));
    const containsGenericPattern = GENERIC_TITLE_PATTERNS.some(pattern => upper.includes(pattern));

    return uniqueWords.size < MINIMUM_UNIQUE_WORDS && containsGenericPattern;
};

const isCleanedTextUsable = (cleaned: string): boolean =>
    isNotEmptyString(cleaned) && cleaned.length >= MINIMUM_TITLE_LENGTH && !isGenericTitle(cleaned);

const escapeRegexToken = (token: string): string => token.replace(REGEX_SPECIAL_CHARACTERS, '\\$&');

const buildFlexibleContainsRegex = (text: string): string => {
    const tokens = text.split(TOKEN_SEPARATOR).filter(isNotEmptyString).map(escapeRegexToken);
    let regex = '';

    for (const token of tokens) {
        const nextRegex = isNotEmptyString(regex) ? `${regex}.*${token}` : token;

        if (nextRegex.length > MAX_CONDITION_REGEX_LENGTH) {
            return regex;
        }

        regex = nextRegex;
    }

    return regex;
};

const buildTextCondition = (
    field: RuleConditionFieldEnum.TITLE | RuleConditionFieldEnum.COMMENT,
    text: string
): RuleConditionCreateInputInterface | null => {
    const cleanedText = cleanMerchantTitle(text);

    if (!isCleanedTextUsable(cleanedText)) {
        return null;
    }

    if (text.toLowerCase().includes(cleanedText.toLowerCase())) {
        return {
            field,
            operator: RuleConditionOperatorEnum.CONTAINS,
            value: cleanedText,
            secondaryValue: null
        };
    }

    const regex = buildFlexibleContainsRegex(cleanedText);

    if (!isNotEmptyString(regex)) {
        return null;
    }

    return {
        field,
        operator: RuleConditionOperatorEnum.MATCHES_REGEX,
        value: regex,
        secondaryValue: null
    };
};

export const selectSuggestConditions = (
    title: string,
    mccCode: string | null,
    comment?: string
): RuleConditionCreateInputInterface[] | null => {
    const conditions: RuleConditionCreateInputInterface[] = [];

    if (isNotEmptyString(mccCode)) {
        conditions.push({
            field: RuleConditionFieldEnum.MCC_CODE,
            operator: RuleConditionOperatorEnum.EQUALS,
            value: mccCode,
            secondaryValue: null
        });
    }

    const titleCondition = buildTextCondition(RuleConditionFieldEnum.TITLE, title);

    if (isDefined(titleCondition)) {
        conditions.push(titleCondition);
    } else if (isNotEmptyString(comment)) {
        const commentCondition = buildTextCondition(RuleConditionFieldEnum.COMMENT, comment);

        if (isDefined(commentCondition)) {
            conditions.push(commentCondition);
        }
    }

    return isNotEmptyArray(conditions) ? conditions : null;
};
