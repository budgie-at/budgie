import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { BudgetSelector } from '../../budget.selector';
import { BudgetCategoryLimitRow } from '../budget-category-limit-row/budget-category-limit-row';

import type { BudgetCategoryLimitEntityInterface } from '@budgie/contracts';

interface Props {
    readonly categoryLimits: readonly BudgetCategoryLimitEntityInterface[];
    readonly spentByCategoryMap: ReadonlyMap<number, number>;
}

export const BudgetCategoryLimitsCard = ({ categoryLimits, spentByCategoryMap }: Props) => (
    <Card variant="ghost" className="gap-y-lg">
        <Text className="text-primary font-semibold text-md">
            <Trans>Category limits</Trans>
        </Text>

        {categoryLimits.map(limit => (
            <BudgetCategoryLimitRow
                key={limit.id}
                categoryId={limit.categoryId}
                limitAmount={limit.limitAmount}
                spent={spentByCategoryMap.get(limit.categoryId) ?? 0}
                testID={BudgetSelector.DetailCategoryRow(limit.categoryId)}
            />
        ))}
    </Card>
);
