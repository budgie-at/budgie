import { RuleWithActionsRelationsEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { ReactElement } from 'react';
import { View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { BudgieLegendList } from '../../../@generic/component/budgie-legend-list/budgie-legend-list';
import { DeletableRow } from '../../../@generic/component/deletable-row/deletable-row';
import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { SearchablePageEmptyState } from '../../../@generic/component/searchagle-page-empty-state/searchagle-page-empty-state';
import { LEGEND_LIST_CONTENT_GAP, LEGEND_LIST_HEADER_HEIGHT, LEGEND_LIST_STYLE } from '../../../@generic/constant/legend-list.constant';
import { RULES_LIST_SIZING } from '../../constant/rules-list-sizing.constant';
import { useRulesListPageActions } from '../../hooks/use-rules-list-page-actions.hook';
import { RulesPageSelector } from '../../selector/rules-page.selector';
import { RuleCard } from '../rule-card/rule-card';
import { RuleIndicatorPill } from '../rule-indicator-pill/rule-indicator-pill';

import type { RulesListPagePropsInterface } from '../../interface/rules-list-page-props.interface';

const CONTENT_CONTAINER_STYLE = { gap: LEGEND_LIST_CONTENT_GAP };
const HEADER_SPACER_STYLE = { height: LEGEND_LIST_HEADER_HEIGHT };

const listHeader = <View style={HEADER_SPACER_STYLE} />;
const listFooter = <MenuSpacer />;
const getKeyExtractor = (item: Pick<RuleWithActionsRelationsEntityInterface, 'id'>) => item.id.toString();

export const RulesListPage = ({ matchingRuleIds = [], onGoBack }: RulesListPagePropsInterface) => {
    const { t } = useLingui();
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
    ) : (
        listHeader
    );

    const renderItem = ({ item, index }: { item: RuleWithActionsRelationsEntityInterface; index: number }): ReactElement => (
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
        <Page testID={RulesPageSelector.Page} header={<PageHeader onGoBack={onGoBack} title={t`Rules`} />} withBlur>
            {isNotEmptyArray(visibleRules) ? (
                <BudgieLegendList
                    style={LEGEND_LIST_STYLE}
                    contentContainerStyle={CONTENT_CONTAINER_STYLE}
                    ListHeaderComponent={listHeaderComponent}
                    estimatedHeaderSize={LEGEND_LIST_HEADER_HEIGHT}
                    data={visibleRules}
                    renderItem={renderItem}
                    keyExtractor={getKeyExtractor}
                    estimatedItemSize={RULES_LIST_SIZING.estimatedItemSize}
                    ListFooterComponent={listFooter}
                />
            ) : (
                <SearchablePageEmptyState
                    testID={RulesPageSelector.EmptyState}
                    title={t`No Rules Yet`}
                    icon={UserIconNameEnum.Zap}
                    description={t`Create rules to automatically categorize and tag your bank transactions`}
                />
            )}
        </Page>
    );
};
