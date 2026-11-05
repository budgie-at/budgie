import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { TransactionInfoRow } from '../../../transaction/components/transaction-info-row/transaction-info-row';
import { RecurringDetailSelector } from '../recurring-detail-content/recurring-detail.selector';
import { RecurringDetailSection } from '../recurring-detail-section/recurring-detail-section';

interface Props {
    readonly dates: readonly Date[];
}

export const RecurringDetailNextPayments = ({ dates }: Props) => {
    const { t } = useLingui();
    const { formatWeekdayAndDay } = useFormatDate();

    if (!isNotEmptyArray(dates)) {
        return null;
    }

    return (
        <RecurringDetailSection title={t`Next payments`}>
            {dates.map((date, index) => (
                <TransactionInfoRow
                    key={date.getTime()}
                    icon={UserIconNameEnum.CalendarClock}
                    value={formatWeekdayAndDay(date)}
                    testID={RecurringDetailSelector.NextPayment(index)}
                />
            ))}
        </RecurringDetailSection>
    );
};
