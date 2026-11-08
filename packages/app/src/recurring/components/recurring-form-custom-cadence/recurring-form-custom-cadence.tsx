import { RecurringCadenceUnitEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useController, useFormContext } from 'react-hook-form';
import { View } from 'react-native';

import { SegmentedControl } from '../../../@generic/component/segmented-control/segmented-control';
import { RecurringFormNumberRow } from '../recurring-form-number-row/recurring-form-number-row';
import { RecurringSeriesFormSelector } from '../recurring-series-form-screen/recurring-series-form.selector';

import type { SegmentedControlSegmentInterface } from '../../../@generic/interface/segmented-control-segment.interface';
import type { RecurringSeriesFormValues } from '../../constant/recurring-series-form-schema.constant';

export const RecurringFormCustomCadence = () => {
    const { t } = useLingui();
    const { control } = useFormContext<RecurringSeriesFormValues>();
    const {
        field: { value, onChange }
    } = useController({ control, name: 'customUnit' });
    const segments: readonly SegmentedControlSegmentInterface<RecurringCadenceUnitEnum>[] = [
        {
            value: RecurringCadenceUnitEnum.WEEK,
            label: t`Weeks`,
            testID: RecurringSeriesFormSelector.CustomUnit(RecurringCadenceUnitEnum.WEEK)
        },
        {
            value: RecurringCadenceUnitEnum.MONTH,
            label: t`Months`,
            testID: RecurringSeriesFormSelector.CustomUnit(RecurringCadenceUnitEnum.MONTH)
        },
        {
            value: RecurringCadenceUnitEnum.YEAR,
            label: t`Years`,
            testID: RecurringSeriesFormSelector.CustomUnit(RecurringCadenceUnitEnum.YEAR)
        }
    ];

    return (
        <>
            <RecurringFormNumberRow name="customInterval" label={t`Every`} testID={RecurringSeriesFormSelector.CustomInterval} />
            <View className="p-md">
                <SegmentedControl segments={segments} value={value} onChange={onChange} />
            </View>
        </>
    );
};
