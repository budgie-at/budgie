import { BudgetKindEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { EntranceReveal } from '../../../@generic/component/entrance-reveal/entrance-reveal';
import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { SectionHeader } from '../../../@generic/component/section-header/section-header';
import { useNonSystemCategoriesQuery } from '../../../category/query/use-non-system-categories.query';
import { useGetBudgetEffectiveLimitsQuery } from '../../query/use-get-budget-effective-limits.query';
import { BudgetDetailsCategoryRow } from '../budget-details-category-row/budget-details-category-row';
import { BudgetDetailsOtherCategoryRow } from '../budget-details-other-category-row/budget-details-other-category-row';

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
    const { categories } = useNonSystemCategoriesQuery();
    const effectiveLimits = useGetBudgetEffectiveLimitsQuery(budget);
    const titleByCategoryId = new Map(categories.map(category => [category.id, category.title]));
    const categoryIds = projection.categories.map(category => category.categoryId);
    const carriedAmountByCategory = new Map(effectiveLimits.categoryLimits.map(limit => [limit.categoryId, limit.carriedAmount]));
    const isOtherRowVisible = budget.kind === BudgetKindEnum.MAIN || isPositiveNumber(projection.other.limit);
    const hasCategoryLimits = isNotEmptyArray(projection.categories) || isPositiveNumber(budget.otherLimit);

    const handleAddLimitsPress = () => {
        if (budget.kind === BudgetKindEnum.EVENT) {
            router.push({ pathname: '/budget/event/[id]/edit', params: { id: String(budget.id) } });
        } else {
            router.push({ pathname: '/budget/edit', params: { id: String(budget.id) } });
        }
    };

    const rows = hasCategoryLimits ? (
        <>
            {projection.categories.map((category, index) => (
                <BudgetDetailsCategoryRow
                    key={category.categoryId}
                    categoryId={category.categoryId}
                    title={titleByCategoryId.get(category.categoryId) ?? ''}
                    scope={category}
                    carriedAmount={carriedAmountByCategory.get(category.categoryId) ?? 0}
                    periodStart={periodStart}
                    periodEnd={periodEnd}
                    currencySymbol={currencySymbol}
                    staggerIndex={index}
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
                />
            ) : null}
            <Text className="text-xs text-secondary-foreground">
                <Trans>Tick marks where spending should be by today.</Trans>
            </Text>
        </>
    ) : (
        <GroupedListSection footer={t`Optional. The overall limit applies without them.`}>
            <GroupedListRow
                left={<GroupedListIcon icon={UserIconNameEnum.ListPlus} />}
                title={t`Add category limits`}
                titleClassName="text-default-foreground"
                onPress={handleAddLimitsPress}
            />
        </GroupedListSection>
    );

    return (
        <EntranceReveal step={4} className="gap-y-lg">
            <SectionHeader label={t`Categories`} />

            {rows}
        </EntranceReveal>
    );
};
