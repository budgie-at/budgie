import { useLingui } from '@lingui/react/macro';
import { useController, useFormContext } from 'react-hook-form';
import { View } from 'react-native';

import { GroupedListSectionTitle } from '../../../@generic/component/grouped-list-section-title/grouped-list-section-title';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { SegmentedControl } from '../../../@generic/component/segmented-control/segmented-control';
import { RecurringEndModeEnum } from '../../enum/recurring-end-mode.enum';
import { RecurringFormDateRow } from '../recurring-form-date-row/recurring-form-date-row';
import { RecurringFormNumberRow } from '../recurring-form-number-row/recurring-form-number-row';
import { RecurringSeriesFormSelector } from '../recurring-series-form-screen/recurring-series-form.selector';

import type { SegmentedControlSegmentInterface } from '../../../@generic/interface/segmented-control-segment.interface';
import type { RecurringSeriesFormValues } from '../../constant/recurring-series-form-schema.constant';

export const RecurringFormEndSection = () => {
    const { t } = useLingui();
    const { control } = useFormContext<RecurringSeriesFormValues>();
    const {
        field: { value, onChange }
    } = useController({ control, name: 'endMode' });
    const segments: readonly SegmentedControlSegmentInterface<RecurringEndModeEnum>[] = [
        { value: RecurringEndModeEnum.NEVER, label: t`Never`, testID: RecurringSeriesFormSelector.End(RecurringEndModeEnum.NEVER) },
        { value: RecurringEndModeEnum.ON_DATE, label: t`On date`, testID: RecurringSeriesFormSelector.End(RecurringEndModeEnum.ON_DATE) },
        {
            value: RecurringEndModeEnum.AFTER_COUNT,
            label: t`After`,
            testID: RecurringSeriesFormSelector.End(RecurringEndModeEnum.AFTER_COUNT)
        }
    ];

    return (
        <View className="gap-y-md">
            <View>
                <GroupedListSectionTitle title={t`Ends`} />
                <SegmentedControl segments={segments} value={value} onChange={onChange} className="min-h-[44px]" />
            </View>
            {value === RecurringEndModeEnum.ON_DATE ? (
                <GroupedListSection>
                    <RecurringFormDateRow name="endsOn" title={t`End date`} testID={RecurringSeriesFormSelector.EndDate} />
                </GroupedListSection>
            ) : null}
            {value === RecurringEndModeEnum.AFTER_COUNT ? (
                <GroupedListSection>
                    <RecurringFormNumberRow name="endsAfterCount" label={t`Payments`} testID={RecurringSeriesFormSelector.EndCount} />
                </GroupedListSection>
            ) : null}
        </View>
    );
};
