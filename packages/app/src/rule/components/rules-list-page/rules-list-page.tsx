import {
    RuleActionTypeEnum,
    RuleConditionMatchTypeEnum,
    RuleWithActionsRelationsEntityInterface,
    UserIconNameEnum
} from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { ReactElement, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { BlurGradient } from '../../../@generic/component/blur-gradient/blur-gradient';
import { BudgieLegendList } from '../../../@generic/component/budgie-legend-list/budgie-legend-list';
import { DeletableRow } from '../../../@generic/component/deletable-row/deletable-row';
import { KeyboardStickySearchInput } from '../../../@generic/component/keyboard-sticky-search-input/keyboard-sticky-search-input';
import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { SearchablePageEmptyState } from '../../../@generic/component/searchagle-page-empty-state/searchagle-page-empty-state';
import {
    SEARCH_BLUR_OFFSET,
    SEARCH_BLUR_Z_INDEX,
    SEARCH_INPUT_VERTICAL_OFFSET,
    SEARCH_KEYBOARD_GAP
} from '../../../@generic/component/searchable-page/searchable-page.constant';
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../../@generic/constant/floating-tab-bar.constant';
import { LEGEND_LIST_CONTENT_GAP, LEGEND_LIST_HEADER_HEIGHT, LEGEND_LIST_STYLE } from '../../../@generic/constant/legend-list.constant';
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

const CONTENT_CONTAINER_STYLE = { gap: LEGEND_LIST_CONTENT_GAP };
const HEADER_SPACER_STYLE = { height: LEGEND_LIST_HEADER_HEIGHT };

const listHeader = <View style={HEADER_SPACER_STYLE} />;
const listFooter = <MenuSpacer />;
const getKeyExtractor = (item: Pick<RuleWithActionsRelationsEntityInterface, 'id'>) => item.id.toString();
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
        return 120;
    }

    if (text.startsWith(token)) {
        return 90;
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
const getSearchScore = (parts: readonly (string | null | undefined)[], tokens: readonly string[]) => {
    const searchableText = normalizeSearchText(parts.filter(isDefined).join(' '));
    const tokenScores = tokens.map(token => getTokenScore(searchableText, token));
    const hasEveryToken = tokenScores.every(score => score > 0);

    if (!hasEveryToken) {
        return 0;
    }

    return tokenScores.reduce((total, score) => total + score, 0);
};

export const RulesListPage = ({ matchingRuleIds = [], onGoBack }: Props) => {
    const { t } = useLingui();
    const { bottom } = useSafeAreaInsets();
    const [search, setSearch] = useState('');
    const { rules, handleDeleteRule, handleOpenRule, handleToggleRule } = useRulesListPageActions();
    const matchingRulesCount = matchingRuleIds.length;
    const isMatchingRulesFilterActive = isNotEmptyArray(matchingRuleIds);
    const searchInputBottom = FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN + bottom - SEARCH_INPUT_VERTICAL_OFFSET;
    const searchBlurStyle = { bottom: searchInputBottom - SEARCH_BLUR_OFFSET, zIndex: SEARCH_BLUR_Z_INDEX };
    const searchTokens = splitSearchTokens(search);
    const matchedRules = isMatchingRulesFilterActive && isDefined(rules) ? rules.filter(rule => matchingRuleIds.includes(rule.id)) : rules;
    const visibleRules = isNotEmptyArray(searchTokens) && isDefined(matchedRules)
        ? matchedRules
              .map(rule => {
                  const conditionParts = rule.conditions.flatMap(condition => [
                      t(RULE_CONDITION_FIELD[condition.field]),
                      t(RULE_CONDITION_OPERATOR[condition.operator]),
                      condition.field,
                      condition.operator,
                      condition.value,
                      condition.secondaryValue
                  ]);
                  const statusParts = rule.enabled ? ['enabled', 'active', 'on'] : ['disabled', 'inactive', 'off'];
                  const matchTypeParts =
                      rule.conditionMatchType === RuleConditionMatchTypeEnum.ALL ? ['all', 'and'] : ['any', 'or'];
                  const score = getSearchScore(
                      [
                          rule.id.toString(),
                          rule.conditionMatchType,
                          ...statusParts,
                          ...matchTypeParts,
                          ...conditionParts,
                          ...getActionSearchParts(rule)
                      ],
                      searchTokens
                  );

                  return { rule, score };
              })
              .filter(({ score }) => score > 0)
              .sort((left, right) => right.score - left.score)
              .map(({ rule }) => rule)
        : matchedRules;
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
        <View className="flex-1">
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
                        keyboardShouldPersistTaps="handled"
                    />
                ) : (
                    <SearchablePageEmptyState
                        testID={RulesPageSelector.EmptyState}
                        title={isNotEmptyString(search.trim()) ? t`No matching rules` : t`No Rules Yet`}
                        icon={UserIconNameEnum.Zap}
                        description={
                            isNotEmptyString(search.trim())
                                ? t`Try searching by condition, action, category, tag, account, status, or value`
                                : t`Create rules to automatically categorize and tag your bank transactions`
                        }
                    />
                )}
            </Page>

            <View className="absolute inset-x-0 h-[150px]" style={searchBlurStyle}>
                <BlurGradient position="bottom" />
            </View>
            <KeyboardStickySearchInput
                search={search}
                placeholder={t`Search rules...`}
                onSearchChange={setSearch}
                inputBottom={searchInputBottom}
                keyboardGap={SEARCH_KEYBOARD_GAP}
                testID={RulesPageSelector.SearchInput}
            />
        </View>
    );
};
