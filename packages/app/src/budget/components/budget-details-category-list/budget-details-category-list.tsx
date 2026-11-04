import { BudgetKindEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { EntranceReveal } from '../../../@generic/component/entrance-reveal/entrance-reveal';
import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { SectionHeader } from '../../../@generic/component/section-header/section-header';
import { useGetBudgetEffectiveLimitsQuery } from '../../query/use-get-budget-effective-limits.query';
import { BudgetDetailsCategoryRow } from '../budget-details-category-row/budget-details-category-row';
import { BudgetDetailsOtherCategoryRow } from '../budget-details-other-category-row/budget-details-other-category-row';
import { BudgetEventCategoryListFooter } from '../budget-event-category-list-footer/budget-event-category-list-footer';
import { BudgetEventExpensesRow } from '../budget-event-expenses-row/budget-event-expenses-row';

import type { BudgetProjectionInterface } from '@budgie/budget';
import type { BudgetEntityInterface } from '@budgie/contracts';

interface Props {
    readonly budget: BudgetEntityInterface;
    readonly projection: BudgetProjectionInterface;
    readonly periodStart: Date;
    readonly periodEnd: Date;
    readonly currencySymbol: string;
}

export const BudgetDetailsCategoryList = ({ budget, projection, periodStart, periodEnd, currencySymbol }: Props) => {
    const { t } = useLingui();
    const effectiveLimits = useGetBudgetEffectiveLimitsQuery(budget);
    const categoryIds = projection.categories.map(category => category.categoryId);
    const carriedAmountByCategory = new Map(effectiveLimits.categoryLimits.map(limit => [limit.categoryId, limit.carriedAmount]));
    const isOtherRowVisible = budget.kind === BudgetKindEnum.MAIN || isPositiveNumber(projection.other.limit);
    const hasCategoryLimits = isNotEmptyArray(projection.categories) || isPositiveNumber(budget.otherLimit);
    const isEvent = budget.kind === BudgetKindEnum.EVENT;

    const handleAddLimitsPress = () => {
        router.push({ pathname: '/budget/edit', params: { id: String(budget.id) } });
    };

    const rows = hasCategoryLimits ? (
        <>
            {projection.categories.map((category, index) => (
                <BudgetDetailsCategoryRow
                    key={category.categoryId}
                    categoryId={category.categoryId}
                    scope={category}
                    carriedAmount={carriedAmountByCategory.get(category.categoryId) ?? 0}
                    periodStart={periodStart}
                    periodEnd={periodEnd}
                    currencySymbol={currencySymbol}
                    staggerIndex={index}
                    tagId={budget.tagId}
                />
            ))}
            {isOtherRowVisible ? (
                <BudgetDetailsOtherCategoryRow
                    categoryIds={categoryIds}
                    scope={projection.other}
                    carriedAmount={effectiveLimits.otherCarriedAmount}
                    periodStart={periodStart}
                    periodEnd={periodEnd}
                    currencySymbol={currencySymbol}
                    staggerIndex={categoryIds.length}
                    tagId={budget.tagId}
                />
            ) : null}
            {isEvent ? (
                <BudgetEventCategoryListFooter
                    categoryIds={categoryIds}
                    otherScope={projection.other}
                    tagId={budget.tagId}
                    periodStart={periodStart}
                    periodEnd={periodEnd}
                    currencySymbol={currencySymbol}
                />
            ) : (
                <Text className="text-xs text-secondary-foreground">
                    <Trans>Ticks show where spending should be by today.</Trans>
                </Text>
            )}
        </>
    ) : (
        <GroupedListSection footer={t`Optional. The overall limit applies without them.`}>
            <GroupedListRow
                left={<GroupedListIcon icon={UserIconNameEnum.ListPlus} />}
                title={
                    <Text className="text-default-foreground text-[17px]" numberOfLines={2}>
                        {t`Add category limits`}
                    </Text>
                }
                onPress={handleAddLimitsPress}
            />
        </GroupedListSection>
    );

    if (isEvent && !hasCategoryLimits) {
        return (
            <View className="gap-y-lg">
                {isPositiveNumber(budget.tagId) ? (
                    <BudgetEventExpensesRow tagId={budget.tagId} periodStart={periodStart} periodEnd={periodEnd} />
                ) : null}
                <Text className="text-xs text-secondary-foreground">
                    <Trans>Tagged expenses also count in your main budget.</Trans>
                </Text>
            </View>
        );
    }

    return (
        <EntranceReveal step={4} className="gap-y-lg">
            <SectionHeader label={t`Categories`} />

            {rows}
        </EntranceReveal>
    );
};
