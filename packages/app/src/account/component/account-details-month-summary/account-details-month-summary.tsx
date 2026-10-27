import { DEFAULT_TRANSACTION_FILTER, DatePeriodEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { getDateFilterByPeriod } from '../../../@generic/utils/date/get-date-filter-by-period.util';
import { useGetTotalIncomeAndExpensesQuery } from '../../../transaction/query/use-get-total-income-and-expenses.query';
import { AccountDetailsMonthStat } from '../account-details-month-stat/account-details-month-stat';

interface Props {
    readonly accountId: number;
}

export const AccountDetailsMonthSummary = ({ accountId }: Props) => {
    const { t } = useLingui();
    const { expense, income } = useGetTotalIncomeAndExpensesQuery({
        ...DEFAULT_TRANSACTION_FILTER,
        accountIds: [accountId],
        date: getDateFilterByPeriod(DatePeriodEnum.THIS_MONTH)
    });

    return (
        <View className="gap-y-md">
            <Text className="uppercase text-secondary-foreground text-xs">
                <Trans>This month</Trans>
            </Text>

            <Card className="flex-row items-center gap-x-xl">
                <AccountDetailsMonthStat amount={expense} label={t`Spent`} icon={UserIconNameEnum.TrendingDown} variant="destructive" />
                <View className="w-px self-stretch bg-secondary-corner" />
                <AccountDetailsMonthStat amount={income} label={t`Income`} icon={UserIconNameEnum.TrendingUp} variant="positive" />
            </Card>
        </View>
    );
};
