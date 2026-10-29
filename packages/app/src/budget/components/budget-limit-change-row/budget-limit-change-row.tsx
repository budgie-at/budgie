import { BudgetLimitChangeReasonEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';

import type { BudgetLimitChangeEntityInterface } from '@budgie/contracts';

interface Props {
    readonly change: BudgetLimitChangeEntityInterface;
    readonly currencySymbol: string;
}

export const BudgetLimitChangeRow = ({ change, currencySymbol }: Props) => {
    const { t } = useLingui();
    const { formatMonthAndDay } = useFormatDate();
    const formatDigits = useFormatDigits(0);
    const { category } = useGetCategoryByIdQuery(isDefined(change.categoryId) ? change.categoryId : 0);
    const name = isDefined(category) ? category.title : t`Other`;
    const previousLabel = formatDigits(convertFromMicroUnits(change.previousAmount), currencySymbol);
    const newLabel = formatDigits(convertFromMicroUnits(change.newAmount), currencySymbol);
    const count = change.periodsObserved;
    const dateLabel = formatMonthAndDay(change.createdAt);
    const raisedLabel = t`Raised. Over the limit ${count} periods in a row. ${dateLabel}`;
    const loweredLabel = t`Lowered. Under 80% for ${count} periods. ${dateLabel}`;
    const reasonLabel = change.reason === BudgetLimitChangeReasonEnum.OVER_SPENT ? raisedLabel : loweredLabel;

    return (
        <View className="gap-y-xs py-md">
            <View className="flex-row items-baseline justify-between gap-x-md">
                <Text numberOfLines={1} className="shrink text-md font-medium text-primary">
                    {name}
                </Text>
                <Text className="text-md font-semibold tabular-nums text-primary">{`${previousLabel} → ${newLabel}`}</Text>
            </View>
            <Text className="text-xs text-secondary-foreground">{reasonLabel}</Text>
        </View>
    );
};
