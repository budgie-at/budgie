import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

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

    if (isDenied) {
        return (
            <RecurringDetailSection title={t`Reminder`}>
                <RecurringReminderDeniedRow />
            </RecurringDetailSection>
        );
    }

    return (
        <View className="gap-y-sm">
            <Text accessibilityRole="header" className="px-3xl text-[13px] font-medium text-secondary-foreground">
                <Trans>Reminder</Trans>
            </Text>
            <RecurringReminderChoices seriesId={series.id} reminderDaysBefore={series.reminderDaysBefore} />
            <Text className="px-3xl pt-xs text-[13px] text-primary/65">
                <Trans>Notify before the payment is due.</Trans>
            </Text>
        </View>
    );
};
