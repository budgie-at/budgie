import { BudgetLimitChangeReasonEnum, UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
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
    const icon = isDefined(category) ? category.icon : UserIconNameEnum.CircleEllipsis;
    const count = change.periodsObserved;
    const dateLabel = formatMonthAndDay(change.periodStart);
    const reasonLabel =
        change.reason === BudgetLimitChangeReasonEnum.OVER_SPENT
            ? t`Raised ${dateLabel} · over the limit ${count} periods in a row`
            : t`Lowered ${dateLabel} · under 80% for ${count} periods`;

    return (
        <GroupedListRow
            left={<GroupedListIcon icon={icon} />}
            title={name}
            subtitle={reasonLabel}
            right={
                <View className="flex-row items-baseline gap-x-xs">
                    <Text className="text-[15px] tabular-nums text-secondary-foreground">
                        {formatDigits(convertFromMicroUnits(change.previousAmount), currencySymbol)} →
                    </Text>
                    <Text className="text-[17px] font-semibold tabular-nums text-primary">
                        {formatDigits(convertFromMicroUnits(change.newAmount), currencySymbol)}
                    </Text>
                </View>
            }
        />
    );
};
