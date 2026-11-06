import { RecurringService } from '@budgie/recurring';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Notifications from 'expo-notifications';

import { SegmentedControl } from '../../../@generic/component/segmented-control/segmented-control';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { Workload } from '../../../@generic/service/workload.service';
import { toNativeCallError } from '../../../@generic/utils/to-native-call-error.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { RECURRING_REMINDER_DAYS } from '../../constant/recurring-reminder-days.constant';
import { RecurringReminderChoiceEnum } from '../../enum/recurring-reminder-choice.enum';
import { useNotificationPermission } from '../../hook/use-notification-permission.hook';
import { RecurringReminderService } from '../../service/recurring-reminder.service';
import { getRecurringReminderChoice } from '../../utils/get-recurring-reminder-choice.util';
import { RecurringDetailSelector } from '../recurring-detail-content/recurring-detail.selector';

import type { SegmentedControlSegmentInterface } from '../../../@generic/interface/segmented-control-segment.interface';

interface Props {
    readonly seriesId: number;
    readonly reminderDaysBefore: number | null;
}

export const RecurringReminderChoices = ({ seriesId, reminderDaysBefore }: Props) => {
    const { t } = useLingui();
    const { run } = useSingleFlight();
    const { refresh } = useNotificationPermission();
    const segments: readonly SegmentedControlSegmentInterface<RecurringReminderChoiceEnum>[] = [
        {
            value: RecurringReminderChoiceEnum.OFF,
            label: t`Off`,
            testID: RecurringDetailSelector.ReminderChoice(RecurringReminderChoiceEnum.OFF)
        },
        {
            value: RecurringReminderChoiceEnum.SAME_DAY,
            label: t`Same day`,
            testID: RecurringDetailSelector.ReminderChoice(RecurringReminderChoiceEnum.SAME_DAY)
        },
        {
            value: RecurringReminderChoiceEnum.ONE_DAY,
            label: t`1 day`,
            testID: RecurringDetailSelector.ReminderChoice(RecurringReminderChoiceEnum.ONE_DAY)
        },
        {
            value: RecurringReminderChoiceEnum.THREE_DAYS,
            label: t`3 days`,
            testID: RecurringDetailSelector.ReminderChoice(RecurringReminderChoiceEnum.THREE_DAYS)
        }
    ];

    const handleChange = (choice: RecurringReminderChoiceEnum) => {
        void run(
            Effect.gen(function* () {
                if (choice !== RecurringReminderChoiceEnum.OFF) {
                    const { status } = yield* Effect.tryPromise({
                        try: () => Notifications.requestPermissionsAsync(),
                        catch: toNativeCallError
                    });

                    refresh();

                    if (status !== Notifications.PermissionStatus.GRANTED) {
                        return;
                    }
                }

                const recurringService = yield* RecurringService;
                const recurringReminderService = yield* RecurringReminderService;
                const workload = yield* Workload;

                yield* recurringService.update(seriesId, { reminderDaysBefore: RECURRING_REMINDER_DAYS[choice] });
                yield* workload.schedule('recurring-reminders', recurringReminderService.reschedule(new Date()), { replace: true });
            }).pipe(toastOnFailure(t`Could not update reminder.`))
        );
    };

    return (
        <SegmentedControl
            segments={segments}
            value={getRecurringReminderChoice(reminderDaysBefore)}
            onChange={handleChange}
            className="min-h-[44px]"
        />
    );
};
