import { RuleWithActionsRelationsEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { LEGEND_LIST_HEADER_HEIGHT } from '../../../@generic/constant/legend-list.constant';
import { RULES_LIST_SIZING } from '../../constant/rules-list-sizing.constant';
import { useRulesListPageActions } from '../../hooks/use-rules-list-page-actions.hook';
import { RulesPageSelector } from '../../selector/rules-page.selector';
import { RuleCard } from '../rule-card/rule-card';
import { RuleEmptyState } from '../rule-empty-state/rule-empty-state';
import { RuleIndicatorPill } from '../rule-indicator-pill/rule-indicator-pill';

interface Props {
    readonly matchingRuleIds?: readonly number[];
    readonly onGoBack: () => void;
}

const COMBINING_MARK_REGEX = /\p{Diacritic}/gu;
const DISABLED_SEARCH_VALUE = 'disabled';
const ENABLED_SEARCH_VALUE = 'enabled';
const HEADER_SPACER_STYLE = { height: LEGEND_LIST_HEADER_HEIGHT };
const SEARCH_TOKEN_SEPARATOR = /\s+/u;

const normalizeSearchValue = (value: string) => value.normalize('NFKD').replace(COMBINING_MARK_REGEX, '').toLowerCase().trim();

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
    const matchingRulesCount = matchingRuleIds.length;
    const isMatchingRulesFilterActive = isNotEmptyArray(matchingRuleIds);
    const visibleRules = isMatchingRulesFilterActive && isDefined(rules) ? rules.filter(rule => matchingRuleIds.includes(rule.id)) : rules;
    const matchingRulesFilterLabel = t({
        message: plural(matchingRulesCount, {
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
    ) : null;

    const searchedRules = searchRules(visibleRules, search);

    const renderCard = (rule: RuleWithActionsRelationsEntityInterface, index: number) => (
        <RuleCard
            testID={RulesPageSelector.RuleCard(index)}
            switchTestID={RulesPageSelector.RuleCardEnabledSwitch(index)}
            conditionsTestID={RulesPageSelector.RuleCardConditions(index)}
            actionsTestID={RulesPageSelector.RuleCardActions(index)}
            onOpen={handleOpenRule}
            onToggle={handleToggleRule}
            rule={rule}
        />
    );

    return (
        <SearchablePage
            testID={RulesPageSelector.Page}
            onGoBack={onGoBack}
            onDelete={handleDeleteRule}
            title={t`Rules`}
            searchPlaceholder={t`Search...`}
            data={searchedRules}
            renderCard={renderCard}
            search={search}
            onSearchChange={setSearch}
            searchInputTestID={RulesPageSelector.SearchInput}
            emptyState={<RuleEmptyState search={search} />}
            listHeader={listHeaderComponent}
            estimatedHeaderSize={LEGEND_LIST_HEADER_HEIGHT}
            sizing={RULES_LIST_SIZING}
        />
    );
};
