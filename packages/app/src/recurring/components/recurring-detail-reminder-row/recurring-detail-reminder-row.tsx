import { useLingui } from '@lingui/react/macro';

import { useNotificationPermission } from '../../hook/use-notification-permission.hook';
import { RecurringDetailSection } from '../recurring-detail-section/recurring-detail-section';
import { RecurringReminderChoices } from '../recurring-reminder-choices/recurring-reminder-choices';
import { RecurringReminderDeniedRow } from '../recurring-reminder-denied-row/recurring-reminder-denied-row';

import type { RecurringSeriesListItemInterface } from '@budgie/recurring';

interface Props {
    readonly series: Pick<RecurringSeriesListItemInterface, 'id' | 'reminderDaysBefore'>;
}

export const RecurringDetailReminderRow = ({ series }: Props) => {
    const { t } = useLingui();
    const { isDenied } = useNotificationPermission();

    return (
        <RecurringDetailSection title={t`Reminder`} footer={t`Notify before the payment is due.`}>
            {isDenied ? (
                <RecurringReminderDeniedRow />
            ) : (
                <RecurringReminderChoices seriesId={series.id} reminderDaysBefore={series.reminderDaysBefore} />
            )}
        </RecurringDetailSection>
    );
};
