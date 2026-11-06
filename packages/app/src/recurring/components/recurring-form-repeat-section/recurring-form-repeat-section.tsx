import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useController, useFormContext } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { Icon } from '../../../@generic/component/icon/icon';
import { RecurringRepeatChoiceEnum } from '../../enum/recurring-repeat-choice.enum';
import { useRecurringSchedulePreview } from '../../hook/use-recurring-schedule-preview.hook';
import { RecurringFormCustomCadence } from '../recurring-form-custom-cadence/recurring-form-custom-cadence';
import { RecurringFormDateRow } from '../recurring-form-date-row/recurring-form-date-row';
import { RecurringFormRepeatChip } from '../recurring-form-repeat-chip/recurring-form-repeat-chip';
import { RecurringSeriesFormSelector } from '../recurring-series-form-screen/recurring-series-form.selector';

import type { RecurringSeriesFormValues } from '../../constant/recurring-series-form-schema.constant';

export const RecurringFormRepeatSection = () => {
    const { t } = useLingui();
    const { control } = useFormContext<RecurringSeriesFormValues>();
    const {
        field: { value, onChange }
    } = useController({ control, name: 'repeat' });
    const preview = useRecurringSchedulePreview();
    const isCustom = value === RecurringRepeatChoiceEnum.CUSTOM;
    const previewRow = isNotEmptyString(preview) ? (
        <View className="flex-row items-center gap-x-sm px-3xl pt-md">
            <Icon icon={UserIconNameEnum.CalendarClock} size={16} className="text-secondary-foreground" />
            <Text className="flex-1 text-[15px] text-secondary-foreground">{preview}</Text>
        </View>
    ) : null;

    return (
        <GroupedListSection title={t`Repeats`} footer={previewRow}>
            <View className="m-xl flex-row flex-wrap gap-[3px] rounded-[12px] bg-segmented-track p-[3px]">
                {Object.values(RecurringRepeatChoiceEnum).map(choice => (
                    <RecurringFormRepeatChip key={choice} choice={choice} isSelected={choice === value} onSelect={onChange} />
                ))}
            </View>
            {isCustom ? <RecurringFormCustomCadence /> : null}
            <RecurringFormDateRow name="anchorDate" title={t`Next payment`} testID={RecurringSeriesFormSelector.NextDate} />
        </GroupedListSection>
    );
};
