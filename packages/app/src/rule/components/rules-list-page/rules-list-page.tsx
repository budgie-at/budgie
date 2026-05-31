import { RuleWithActionsRelationsEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { LEGEND_LIST_HEADER_HEIGHT } from '../../../@generic/constant/legend-list.constant';
import { rankSearchableItems } from '../../../@generic/utils/rank-searchable-items.util';
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

const DISABLED_SEARCH_VALUE = 'disabled';
const ENABLED_SEARCH_VALUE = 'enabled';
const HEADER_SPACER_STYLE = { height: LEGEND_LIST_HEADER_HEIGHT };

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

    const searchedRules = rankSearchableItems(visibleRules, search, getRuleSearchValues);

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
