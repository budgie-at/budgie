import {
    RuleActionTypeEnum,
    RuleConditionMatchTypeEnum,
    RuleWithActionsRelationsEntityInterface,
    UserIconNameEnum
} from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { DeletableRow } from '../../../@generic/component/deletable-row/deletable-row';
import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { SearchablePageEmptyState } from '../../../@generic/component/searchagle-page-empty-state/searchagle-page-empty-state';
import { LEGEND_LIST_HEADER_HEIGHT } from '../../../@generic/constant/legend-list.constant';
import { RULE_CONDITION_FIELD } from '../../constant/rule-condition-field.constant';
import { RULE_CONDITION_OPERATOR } from '../../constant/rule-condition-operator.constant';
import { RULES_LIST_SIZING } from '../../constant/rules-list-sizing.constant';
import { useRulesListPageActions } from '../../hooks/use-rules-list-page-actions.hook';
import { RulesPageSelector } from '../../selector/rules-page.selector';
import { RuleCard } from '../rule-card/rule-card';
import { RuleIndicatorPill } from '../rule-indicator-pill/rule-indicator-pill';

interface Props {
    readonly matchingRuleIds?: readonly number[];
    readonly onGoBack: () => void;
}

const HEADER_SPACER_STYLE = { height: LEGEND_LIST_HEADER_HEIGHT };
const normalizeSearchText = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
const splitSearchTokens = (search: string) => normalizeSearchText(search).trim().split(/\s+/).filter(isNotEmptyString);
const isFuzzyMatch = (text: string, token: string) => {
    let tokenIndex = 0;

    for (const character of text) {
        if (character === token[tokenIndex]) {
            tokenIndex += 1;
        }

        if (tokenIndex === token.length) {
            return true;
        }
    }

    return false;
};
const getTokenScore = (text: string, token: string) => {
    if (text === token) {
        return 100;
    }

    if (text.startsWith(token)) {
        return 80;
    }

    if (text.includes(` ${token}`)) {
        return 75;
    }

    if (text.includes(token)) {
        return 60;
    }

    if (isFuzzyMatch(text, token)) {
        return 25;
    }

    return 0;
};
const getActionSearchParts = (rule: RuleWithActionsRelationsEntityInterface) =>
    rule.actions.flatMap(action => [
        action.type,
        action.category?.title,
        action.tag?.title,
        action.account?.title,
        action.categoryId?.toString(),
        action.tagId?.toString(),
        action.accountId?.toString(),
        action.type === RuleActionTypeEnum.SET_CATEGORY ? 'category set assign folder' : '',
        action.type === RuleActionTypeEnum.ADD_TAG ? 'tag add label' : '',
        action.type === RuleActionTypeEnum.CONVERT_TO_TRANSFER ? 'transfer convert account' : ''
    ]);
const getRuleSearchParts = (rule: RuleWithActionsRelationsEntityInterface, translate: ReturnType<typeof useLingui>['t']) => {
    const conditionParts = rule.conditions.flatMap(condition => [
        translate(RULE_CONDITION_FIELD[condition.field]),
        translate(RULE_CONDITION_OPERATOR[condition.operator]),
        condition.field,
        condition.operator,
        condition.value,
        condition.secondaryValue
    ]);
    const statusParts = rule.enabled ? ['enabled', 'active', 'on'] : ['disabled', 'inactive', 'off'];
    const matchTypeParts = rule.conditionMatchType === RuleConditionMatchTypeEnum.ALL ? ['all', 'and'] : ['any', 'or'];

    return [
        rule.id.toString(),
        rule.conditionMatchType,
        ...statusParts,
        ...matchTypeParts,
        ...conditionParts,
        ...getActionSearchParts(rule)
    ];
};
const getSearchScore = (parts: readonly (string | null | undefined)[], tokens: readonly string[]) => {
    const searchableText = normalizeSearchText(parts.filter(isDefined).join(' '));
    const tokenScores = tokens.map(token => getTokenScore(searchableText, token));
    const hasEveryToken = tokenScores.every(score => score > 0);

    if (!hasEveryToken) {
        return 0;
    }

    return tokenScores.reduce((total, score) => total + score, 0);
};
const getVisibleRules = (
    rules: RuleWithActionsRelationsEntityInterface[] | null,
    matchingRuleIds: readonly number[],
    searchTokens: readonly string[],
    translate: ReturnType<typeof useLingui>['t']
) => {
    const matchedRules = isNotEmptyArray(matchingRuleIds) && isDefined(rules) ? rules.filter(rule => matchingRuleIds.includes(rule.id)) : rules;

    if (!isNotEmptyArray(searchTokens) || !isDefined(matchedRules)) {
        return matchedRules;
    }

    return matchedRules
        .map(rule => ({ rule, score: getSearchScore(getRuleSearchParts(rule, translate), searchTokens) }))
        .filter(({ score }) => score > 0)
        .sort((left, right) => right.score - left.score)
        .map(({ rule }) => rule);
};

export const RulesListPage = ({ matchingRuleIds = [], onGoBack }: Props) => {
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const { rules, handleDeleteRule, handleOpenRule, handleToggleRule } = useRulesListPageActions();
    const isMatchingRulesFilterActive = isNotEmptyArray(matchingRuleIds);
    const searchTokens = splitSearchTokens(search);
    const visibleRules = getVisibleRules(rules, matchingRuleIds, searchTokens, t);
    const matchingRulesFilterLabel = t({
        message: plural(matchingRuleIds.length, {
            one: '# matching rule',
            other: '# matching rules'
        })
    });
    const listHeaderComponent = isMatchingRulesFilterActive ? (
        <View style={HEADER_SPACER_STYLE} className="justify-end pb-lg">
            <View testID={RulesPageSelector.MatchingRulesFilter} className="self-start">
                <RuleIndicatorPill icon={UserIconNameEnum.Workflow}>{matchingRulesFilterLabel}</RuleIndicatorPill>
            </View>
        </View>
    ) : undefined;
    const emptyStateTitle = isNotEmptyString(search.trim()) ? t`No matching rules` : t`No Rules Yet`;
    const emptyStateDescription = isNotEmptyString(search.trim())
        ? t`Try searching by condition, action, category, tag, account, status, or value`
        : t`Create rules to automatically categorize and tag your bank transactions`;

    const renderCard = (item: RuleWithActionsRelationsEntityInterface, index: number) => (
        <DeletableRow id={item.id} onDelete={handleDeleteRule}>
            <RuleCard
                testID={RulesPageSelector.RuleCard(index)}
                switchTestID={RulesPageSelector.RuleCardEnabledSwitch(index)}
                conditionsTestID={RulesPageSelector.RuleCardConditions(index)}
                actionsTestID={RulesPageSelector.RuleCardActions(index)}
                onOpen={handleOpenRule}
                onToggle={handleToggleRule}
                rule={item}
            />
        </DeletableRow>
    );

    return (
        <SearchablePage
            onGoBack={onGoBack}
            title={t`Rules`}
            searchPlaceholder={t`Search rules...`}
            data={visibleRules}
            renderCard={renderCard}
            search={search}
            onSearchChange={setSearch}
            searchInputTestID={RulesPageSelector.SearchInput}
            testID={RulesPageSelector.Page}
            sizing={RULES_LIST_SIZING}
            listHeaderComponent={listHeaderComponent}
            emptyState={
                <SearchablePageEmptyState
                    testID={RulesPageSelector.EmptyState}
                    title={emptyStateTitle}
                    icon={UserIconNameEnum.Zap}
                    description={emptyStateDescription}
                />
            }
        />
    );
};
