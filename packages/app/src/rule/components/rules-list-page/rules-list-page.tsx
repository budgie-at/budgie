import { RuleWithActionsRelationsEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { SearchablePageList } from '../../../@generic/component/searchable-page-list/searchable-page-list';
import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { useRulesListPageActions } from '../../hooks/use-rules-list-page-actions.hook';
import { RulesPageSelector } from '../../selector/rules-page.selector';
import { getOverlappingRuleIds } from '../../utils/get-overlapping-rule-ids.util';
import { searchRules } from '../../utils/search-rules.util';
import { RuleEmptyState } from '../rule-empty-state/rule-empty-state';
import { RuleListRow } from '../rule-list-row/rule-list-row';
import { RulesListHeader } from '../rules-list-header/rules-list-header';

import type { LegendListSizingInterface } from '../../../@generic/interface/legend-list-sizing.interface';

interface Props {
    readonly matchingRuleIds?: readonly number[];
    readonly onGoBack: () => void;
}

const RULES_LIST_SIZING: LegendListSizingInterface<RuleWithActionsRelationsEntityInterface> = { estimatedItemSize: 72, gap: 0 };

export const RulesListPage = ({ matchingRuleIds = [], onGoBack }: Props) => {
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const { rules, handleDeleteRule, handleOpenRule, handleToggleRule } = useRulesListPageActions();
    const isMatchingRulesFilterActive = isNotEmptyArray(matchingRuleIds);
    const visibleRules = isMatchingRulesFilterActive && isDefined(rules) ? rules.filter(rule => matchingRuleIds.includes(rule.id)) : rules;
    const overlappingRuleIds = getOverlappingRuleIds(rules ?? []);
    const searchedRules = searchRules(visibleRules, search);
    const deleteConfirmation = { title: t`Delete this rule?`, description: t`Payments it already changed stay as they are.` };
    const getDeleteConfirmation = () => deleteConfirmation;
    const handleClearSearch = () => void setSearch('');

    const renderCard = (rule: RuleWithActionsRelationsEntityInterface, index: number, isLast: boolean) => (
        <RuleListRow
            rule={rule}
            index={index}
            isLast={isLast}
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
