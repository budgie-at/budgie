import { logAndContinue } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Notifications from 'expo-notifications';
import { useController, useFormContext } from 'react-hook-form';
import { Text, View } from 'react-native';

import { GroupedListSectionTitle } from '../../../@generic/component/grouped-list-section-title/grouped-list-section-title';
import { SegmentedControl } from '../../../@generic/component/segmented-control/segmented-control';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { toNativeCallError } from '../../../@generic/utils/to-native-call-error.util';
import { RecurringReminderChoiceEnum } from '../../enum/recurring-reminder-choice.enum';
import { buildRecurringReminderSegments } from '../../utils/build-recurring-reminder-segments.util';
import { RecurringSeriesFormSelector } from '../recurring-series-form-screen/recurring-series-form.selector';

import type { RecurringSeriesFormValues } from '../../constant/recurring-series-form-schema.constant';

export const RecurringFormReminderSection = () => {
    const { t } = useLingui();
    const { control } = useFormContext<RecurringSeriesFormValues>();
    const {
        field: { value, onChange }
    } = useController({ control, name: 'reminder' });
    const segments = buildRecurringReminderSegments(RecurringSeriesFormSelector.Reminder);

    const handleChange = (choice: RecurringReminderChoiceEnum) => {
        onChange(choice);

        if (choice !== RecurringReminderChoiceEnum.OFF) {
            appRuntime.runFork(
                logAndContinue(Effect.tryPromise({ try: () => Notifications.requestPermissionsAsync(), catch: toNativeCallError }))
            );
        }
    };

    return (
        <View>
            <GroupedListSectionTitle title={t`Reminder`} />
            <SegmentedControl segments={segments} value={value} onChange={handleChange} />
            <Text className="px-3xl pt-md text-[13px] leading-[18px] text-primary/65">
                <Trans>Notify before the payment is due.</Trans>
            </Text>
        </View>
    );
};
