import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import type { RuleWithActionsRelationsEntityInterface } from '@budgie/contracts';

const COMBINING_MARK_REGEX = /\p{Diacritic}/gu;
const DISABLED_SEARCH_VALUE = 'disabled';
const ENABLED_SEARCH_VALUE = 'enabled';
const SEARCH_TOKEN_SEPARATOR = /\s+/u;

const normalizeSearchValue = (value: string) => value.normalize('NFKD').replaceAll(COMBINING_MARK_REGEX, '').toLowerCase().trim();

const getSearchTokens = (search: string) => normalizeSearchValue(search).split(SEARCH_TOKEN_SEPARATOR).filter(isNotEmptyString);

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

const getRuleStatusSearchValue = (rule: Pick<RuleWithActionsRelationsEntityInterface, 'enabled'>) =>
    rule.enabled ? ENABLED_SEARCH_VALUE : DISABLED_SEARCH_VALUE;

const getRuleSearchValues = (rule: RuleWithActionsRelationsEntityInterface) => [
    rule.id.toString(),
    rule.conditionMatchType,
    getRuleStatusSearchValue(rule),
    ...rule.conditions.flatMap(condition =>
        [condition.id.toString(), condition.field, condition.operator, condition.value, condition.secondaryValue].filter(isDefined)
    ),
    ...rule.actions.flatMap(action =>
        [
            action.id.toString(),
            action.type,
            action.categoryId?.toString(),
            action.category?.id.toString(),
            action.category?.title,
            action.category?.titleEn,
            action.category?.titleTags,
            action.tagId?.toString(),
            action.tag?.id.toString(),
            action.tag?.title,
            action.accountId?.toString(),
            action.account?.id.toString(),
            action.account?.title,
            action.account?.externalId,
            action.account?.iban
        ].filter(isDefined)
    )
];

export const searchRules = (rules: RuleWithActionsRelationsEntityInterface[] | null, search: string) => {
    if (!isDefined(rules)) {
        return rules;
    }

    const tokens = getSearchTokens(search);

    if (!isNotEmptyArray(tokens)) {
        return rules;
    }

    return rules
        .map((rule, index) => ({ rule, index, score: getSearchScore(getRuleSearchValues(rule), tokens) }))
        .filter(({ score }) => isPositiveNumber(score))
        .sort((left, right) => right.score - left.score || left.index - right.index)
        .map(({ rule }) => rule);
};
