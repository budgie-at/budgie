import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { SectionHeader } from '../../../@generic/component/section-header/section-header';
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
    const effectiveLimits = useGetBudgetEffectiveLimitsQuery(budget);
    const categoryIds = projection.categories.map(category => category.categoryId);
    const carriedAmountByCategory = new Map(effectiveLimits.categoryLimits.map(limit => [limit.categoryId, limit.carriedAmount]));
    const hasCategoryLimits = isNotEmptyArray(projection.categories) || isPositiveNumber(budget.otherLimit);

    const rows = hasCategoryLimits ? (
        <>
            {projection.categories.map(category => (
                <BudgetDetailsCategoryRow
                    key={category.categoryId}
                    categoryId={category.categoryId}
                    scope={category}
                    carriedAmount={carriedAmountByCategory.get(category.categoryId) ?? 0}
                    periodStart={periodStart}
                    periodEnd={periodEnd}
                    currencySymbol={currencySymbol}
                />
            ))}
            <BudgetDetailsOtherCategoryRow
                categoryIds={categoryIds}
                scope={projection.other}
                carriedAmount={effectiveLimits.otherCarriedAmount}
                periodStart={periodStart}
                periodEnd={periodEnd}
                currencySymbol={currencySymbol}
            />
        </>
    ) : (
        <Text className="text-sm text-secondary-foreground">
            <Trans>No category limits yet</Trans>
        </Text>
    );

    return (
        <View className="gap-y-lg">
            <SectionHeader label={t`Categories`} />

            {rows}
        </View>
    );
};
