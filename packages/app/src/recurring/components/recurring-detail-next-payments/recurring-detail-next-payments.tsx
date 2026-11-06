import { UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { TransactionInfoRow } from '../../../transaction/components/transaction-info-row/transaction-info-row';
import { useRecurringDueLabel } from '../../hook/use-recurring-due-label.hook';
import { RecurringDetailSelector } from '../recurring-detail-content/recurring-detail.selector';
import { RecurringDetailSection } from '../recurring-detail-section/recurring-detail-section';

interface Props {
    readonly dates: readonly Date[];
    readonly amount: number;
    readonly now: Date;
}

export const RecurringDetailNextPayments = ({ dates, amount, now }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const protectAmount = useProtectedAmountLabel();
    const { formatWeekdayAndDay } = useFormatDate();
    const getDueLabel = useRecurringDueLabel();
    const formattedAmount = protectAmount(convertFromMicroUnits(amount), defaultInstrument.symbol);

    if (!isNotEmptyArray(dates)) {
        return null;
    }

    return (
        <RecurringDetailSection title={t`Upcoming`}>
            {dates.map((date, index) => (
                <TransactionInfoRow
                    key={date.getTime()}
                    icon={UserIconNameEnum.CalendarClock}
                    value={formatWeekdayAndDay(date)}
                    description={getDueLabel(date, now)}
                    trailing={formattedAmount}
                    testID={RecurringDetailSelector.NextPayment(index)}
                />
            ))}
        </RecurringDetailSection>
    );
};
