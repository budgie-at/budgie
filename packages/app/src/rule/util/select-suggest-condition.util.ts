import { RuleConditionCreateInputInterface, RuleConditionFieldEnum, RuleConditionOperatorEnum } from '@budgie/contracts';

import { isNotEmptyString } from '@rnw-community/shared';

import { cleanMerchantTitle } from './clean-merchant-title.util';

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

export const selectSuggestCondition = (title: string, mccCode: string | null): RuleConditionCreateInputInterface | null => {
    const cleanedTitle = cleanMerchantTitle(title);

    if (isNotEmptyString(cleanedTitle) && cleanedTitle.length >= MINIMUM_TITLE_LENGTH && !isGenericTitle(cleanedTitle)) {
        return {
            field: RuleConditionFieldEnum.TITLE,
            operator: RuleConditionOperatorEnum.CONTAINS,
            value: cleanedTitle,
            secondaryValue: null
        };
    }

    if (isNotEmptyString(mccCode)) {
        return {
            field: RuleConditionFieldEnum.MCC_CODE,
            operator: RuleConditionOperatorEnum.EQUALS,
            value: mccCode,
            secondaryValue: null
        };
    }

    return null;
};
