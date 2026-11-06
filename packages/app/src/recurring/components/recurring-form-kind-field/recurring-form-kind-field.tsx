import { RecurringSeriesKindEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useController, useFormContext } from 'react-hook-form';

import { SegmentedControl } from '../../../@generic/component/segmented-control/segmented-control';
import { RecurringSeriesFormSelector } from '../recurring-series-form-screen/recurring-series-form.selector';

import type { SegmentedControlSegmentInterface } from '../../../@generic/interface/segmented-control-segment.interface';
import type { RecurringSeriesFormValues } from '../../constant/recurring-series-form-schema.constant';

export const RecurringFormKindField = () => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<RecurringSeriesFormValues>();
    const {
        field: { value, onChange }
    } = useController({ control, name: 'kind' });
    const segments: readonly SegmentedControlSegmentInterface<RecurringSeriesKindEnum>[] = [
        {
            value: RecurringSeriesKindEnum.EXPENSE,
            label: t`Expense`,
            testID: RecurringSeriesFormSelector.Kind(RecurringSeriesKindEnum.EXPENSE)
        },
        {
            value: RecurringSeriesKindEnum.INCOME,
            label: t`Income`,
            testID: RecurringSeriesFormSelector.Kind(RecurringSeriesKindEnum.INCOME)
        }
    ];

    const handleChange = (kind: RecurringSeriesKindEnum) => {
        setValue('categoryId', null);
        onChange(kind);
    };

    return <SegmentedControl segments={segments} value={value} onChange={handleChange} className="min-h-[44px]" />;
};
