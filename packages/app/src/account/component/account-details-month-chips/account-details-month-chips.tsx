import { DEFAULT_TRANSACTION_FILTER, DatePeriodEnum, UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { getDateFilterByPeriod } from '../../../@generic/utils/date/get-date-filter-by-period.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useGetTotalIncomeAndExpensesQuery } from '../../../transaction/query/use-get-total-income-and-expenses.query';
import { AccountDetailsMonthChip } from '../account-details-month-chip/account-details-month-chip';

interface Props {
    readonly accountId: number;
}

export const AccountDetailsMonthChips = ({ accountId }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const protectAmount = useProtectedAmountLabel();
    const { expense, income } = useGetTotalIncomeAndExpensesQuery({
        ...DEFAULT_TRANSACTION_FILTER,
        accountIds: [accountId],
        date: getDateFilterByPeriod(DatePeriodEnum.THIS_MONTH)
    });

    if (!isPositiveNumber(expense) && !isPositiveNumber(income)) {
        return null;
    }

    const formattedExpense = protectAmount(expense, defaultInstrument.symbol);
    const formattedIncome = protectAmount(income, defaultInstrument.symbol);

    return (
        <View
            accessible
            accessibilityLabel={t`This month: spent ${formattedExpense}, income ${formattedIncome}`}
            className="flex-row flex-wrap justify-center gap-sm"
        >
            <AccountDetailsMonthChip
                icon={UserIconNameEnum.TrendingDown}
                iconClassName="text-destructive-foreground"
                label={t`Spent`}
                amount={formattedExpense}
            />
            <AccountDetailsMonthChip
                icon={UserIconNameEnum.TrendingUp}
                iconClassName="text-positive-foreground"
                label={t`Income`}
                amount={formattedIncome}
            />
        </View>
    );
};
