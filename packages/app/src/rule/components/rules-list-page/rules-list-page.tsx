import { RuleWithActionsRelationsEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { SearchablePageList } from '../../../@generic/component/searchable-page-list/searchable-page-list';
import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { RULES_LIST_SIZING } from '../../constant/rules-list-sizing.constant';
import { useRulesListPageActions } from '../../hooks/use-rules-list-page-actions.hook';
import { RulesPageSelector } from '../../selector/rules-page.selector';
import { getOverlappingRuleIds } from '../../utils/get-overlapping-rule-ids.util';
import { RuleEmptyState } from '../rule-empty-state/rule-empty-state';
import { RuleListRow } from '../rule-list-row/rule-list-row';
import { RulesListHeader } from '../rules-list-header/rules-list-header';

interface Props {
    readonly matchingRuleIds?: readonly number[];
    readonly onGoBack: () => void;
}

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

const searchRules = (rules: RuleWithActionsRelationsEntityInterface[] | null, search: string) => {
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

export const RulesListPage = ({ matchingRuleIds = [], onGoBack }: Props) => {
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const { rules, handleDeleteRule, handleOpenRule, handleToggleRule } = useRulesListPageActions();
    const isMatchingRulesFilterActive = isNotEmptyArray(matchingRuleIds);
    const visibleRules = isMatchingRulesFilterActive && isDefined(rules) ? rules.filter(rule => matchingRuleIds.includes(rule.id)) : rules;
    const overlappingRuleIds = getOverlappingRuleIds(rules ?? []);
    const searchedRules = searchRules(visibleRules, search);
    const lastIndex = (searchedRules?.length ?? 0) - 1;
    const deleteConfirmation = { title: t`Delete this rule?`, description: t`Payments it already changed stay as they are.` };
    const getDeleteConfirmation = () => deleteConfirmation;
    const handleClearSearch = () => void setSearch('');

    const renderCard = (rule: RuleWithActionsRelationsEntityInterface, index: number) => (
        <RuleListRow
            rule={rule}
            index={index}
            isLast={index === lastIndex}
            hasOverlap={overlappingRuleIds.has(rule.id)}
            onOpen={handleOpenRule}
            onToggle={handleToggleRule}
        />
    );

    return (
        <SearchablePage
            testID={RulesPageSelector.Page}
            title={t`Rules`}
            onGoBack={onGoBack}
            search={search}
            searchPlaceholder={t`Search rules`}
            onSearchChange={setSearch}
            searchInputTestID={RulesPageSelector.SearchInput}
        >
            <SearchablePageList
                data={searchedRules}
                emptyState={<RuleEmptyState search={search} onClearSearch={handleClearSearch} />}
                onDelete={handleDeleteRule}
                getDeleteConfirmation={getDeleteConfirmation}
                renderCard={renderCard}
                listHeader={<RulesListHeader rules={searchedRules ?? []} matchingRulesCount={matchingRuleIds.length} />}
                listFooter={
                    <Text className="text-secondary-foreground px-3xl pt-md text-[13px] leading-[18px]">
                        {t`When two rules set a category, the older one wins. Tap a rule to edit it, swipe left to delete.`}
                    </Text>
                }
                sizing={RULES_LIST_SIZING}
            />
        </SearchablePage>
    );
};
