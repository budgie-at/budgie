import { RecurringSeriesKindEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useController, useFormContext } from 'react-hook-form';

import { SegmentedControl } from '../../../@generic/component/segmented-control/segmented-control';
import { RecurringSeriesFormSelector } from '../recurring-series-form-screen/recurring-series-form.selector';

import type { SegmentedControlSegmentInterface } from '../../../@generic/interface/segmented-control-segment.interface';
import type { RecurringSeriesFormValues } from '../../constant/recurring-series-form-schema.constant';

export const RecurringFormKindField = () => {
    const { t } = useLingui();
    const { control } = useFormContext<RecurringSeriesFormValues>();
    const {
        field: { value, onChange }
    } = useController({ control, name: 'kind' });
    const segments: readonly SegmentedControlSegmentInterface<RecurringSeriesKindEnum>[] = [
        { value: RecurringSeriesKindEnum.EXPENSE, label: t`Expense`, testID: `${RecurringSeriesFormSelector.Kind}.EXPENSE` },
        { value: RecurringSeriesKindEnum.INCOME, label: t`Income`, testID: `${RecurringSeriesFormSelector.Kind}.INCOME` }
    ];

    return <SegmentedControl segments={segments} value={value} onChange={onChange} className="min-h-[44px]" />;
};
