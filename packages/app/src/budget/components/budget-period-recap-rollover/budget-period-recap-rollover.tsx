import { convertFromMicroUnits } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { getBudgetRolloverScopes } from '../../utils/get-budget-rollover-scopes.util';

import type { BudgetPeriodSnapshotWithCategoriesEntityInterface } from '@budgie/contracts';

interface Props {
    readonly snapshot: BudgetPeriodSnapshotWithCategoriesEntityInterface;
    readonly currencySymbol: string;
}

export const BudgetPeriodRecapRollover = ({ snapshot, currencySymbol }: Props) => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();
    const scopes = getBudgetRolloverScopes(snapshot);
    const [firstCategoryId] = scopes[0] ?? [null];
    const { category } = useGetCategoryByIdQuery(firstCategoryId ?? 0);

    if (isEmptyArray(scopes)) {
        return null;
    }

    const count = scopes.length;
    const totalAmount = scopes.reduce((total, [, amount]) => total + amount, 0);
    const formattedAmount = formatDigits(convertFromMicroUnits(Math.abs(totalAmount)), currencySymbol);
    const name = isDefined(category) && isDefined(firstCategoryId) ? category.title : t`Other`;
    const singleMessage = totalAmount > 0 ? t`${formattedAmount} rolled into ${name}` : t`${formattedAmount} carried into ${name}`;
    const message =
        count === 1
            ? singleMessage
            : t({
                  message: plural(count, {
                      one: `${formattedAmount} rolled over across # category`,
                      other: `${formattedAmount} rolled over across # categories`
                  })
              });

    return <Text className="text-secondary-foreground text-xs">{message}</Text>;
};
