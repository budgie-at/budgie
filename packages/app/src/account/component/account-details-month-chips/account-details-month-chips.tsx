import { DEFAULT_TRANSACTION_FILTER, DatePeriodEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { getDateFilterByPeriod } from '../../../@generic/utils/date/get-date-filter-by-period.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useGetTotalIncomeAndExpensesQuery } from '../../../transaction/query/use-get-total-income-and-expenses.query';

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
        <Text
            accessibilityLabel={t`This month: spent ${formattedExpense}, income ${formattedIncome}`}
            className="text-[15px] text-secondary-foreground text-center tabular-nums"
            numberOfLines={1}
        >
            <Trans>
                Spent <Text className="text-primary font-semibold">{formattedExpense}</Text> · Income{' '}
                <Text className="text-primary font-semibold">{formattedIncome}</Text>
            </Trans>
        </Text>
    );
};
