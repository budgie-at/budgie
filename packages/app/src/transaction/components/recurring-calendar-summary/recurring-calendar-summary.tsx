import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { TransactionAnalyticsCard } from '../transaction-analytics-card/transaction-analytics-card';

interface Props {
    readonly totalAmount: number;
}

export const RecurringCalendarSummary = ({ totalAmount }: Props) => {
    const { t } = useLingui();

    return <TransactionAnalyticsCard amount={totalAmount} label={t`Recurring`} icon={UserIconNameEnum.CalendarSync} variant="warning" />;
};
