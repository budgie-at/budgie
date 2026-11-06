import { RecurringCadenceUnitEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useController, useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { GroupedListSectionTitle } from '../../../@generic/component/grouped-list-section-title/grouped-list-section-title';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedListValueRow } from '../../../@generic/component/grouped-list-value-row/grouped-list-value-row';
import { SegmentedControl } from '../../../@generic/component/segmented-control/segmented-control';
import { RecurringRepeatChoiceEnum } from '../../enum/recurring-repeat-choice.enum';
import { useRecurringCadenceLabel } from '../../hook/use-recurring-cadence-label.hook';
import { useRecurringSchedulePreview } from '../../hook/use-recurring-schedule-preview.hook';
import { RecurringFormCustomCadence } from '../recurring-form-custom-cadence/recurring-form-custom-cadence';
import { RecurringFormDateRow } from '../recurring-form-date-row/recurring-form-date-row';
import { RecurringSeriesFormSelector } from '../recurring-series-form-screen/recurring-series-form.selector';

import type { RecurringSeriesFormValues } from '../../constant/recurring-series-form-schema.constant';

const QUARTER_MONTHS = 3;

export const RecurringFormRepeatSection = () => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<RecurringSeriesFormValues>();
    const {
        field: { value, onChange }
    } = useController({ control, name: 'repeat' });
    const [customInterval, customUnit] = useWatch({ control, name: ['customInterval', 'customUnit'] });
    const preview = useRecurringSchedulePreview();
    const getCadenceLabel = useRecurringCadenceLabel();
    const segments = [
        {
            value: RecurringRepeatChoiceEnum.WEEKLY,
            label: t`Weekly`,
            testID: RecurringSeriesFormSelector.Repeat(RecurringRepeatChoiceEnum.WEEKLY)
        },
        {
            value: RecurringRepeatChoiceEnum.BIWEEKLY,
            label: t`Biweekly`,
            testID: RecurringSeriesFormSelector.Repeat(RecurringRepeatChoiceEnum.BIWEEKLY)
        },
        {
            value: RecurringRepeatChoiceEnum.MONTHLY,
            label: t`Monthly`,
            testID: RecurringSeriesFormSelector.Repeat(RecurringRepeatChoiceEnum.MONTHLY)
        },
        {
            value: RecurringRepeatChoiceEnum.YEARLY,
            label: t`Yearly`,
            testID: RecurringSeriesFormSelector.Repeat(RecurringRepeatChoiceEnum.YEARLY)
        }
    ];
    const isCustom = value === RecurringRepeatChoiceEnum.CUSTOM;
    const isQuarterly = value === RecurringRepeatChoiceEnum.QUARTERLY;
    const customValue = isQuarterly ? getCadenceLabel(RecurringCadenceUnitEnum.MONTH, QUARTER_MONTHS) : '';
    const customLabel = isCustom ? getCadenceLabel(customUnit, customInterval) : customValue;
    const previewRow = isNotEmptyString(preview) ? <Text className="px-3xl pt-sm pb-sm text-[15px] text-primary/65">{preview}</Text> : null;

    const handleCustom = () => {
        if (isQuarterly) {
            setValue('customInterval', QUARTER_MONTHS);
            setValue('customUnit', RecurringCadenceUnitEnum.MONTH);
        }
        onChange(RecurringRepeatChoiceEnum.CUSTOM);
    };

    return (
        <View className="gap-y-md">
            <View>
                <GroupedListSectionTitle title={t`Repeats`} />
                <SegmentedControl segments={segments} value={value} onChange={onChange} className="min-h-[44px]" />
            </View>
            <GroupedListSection footer={previewRow}>
                <GroupedListValueRow
                    icon={UserIconNameEnum.Repeat}
                    title={t`Custom schedule…`}
                    value={customLabel}
                    testID={RecurringSeriesFormSelector.Repeat(RecurringRepeatChoiceEnum.CUSTOM)}
                    onPress={handleCustom}
                />
                {isCustom ? <RecurringFormCustomCadence /> : null}
                <RecurringFormDateRow name="anchorDate" title={t`Next payment`} testID={RecurringSeriesFormSelector.NextDate} />
            </GroupedListSection>
        </View>
    );
};
