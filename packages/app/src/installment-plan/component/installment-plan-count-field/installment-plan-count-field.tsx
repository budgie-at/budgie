import { useLingui } from '@lingui/react/macro';
import { Control, Controller } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { InstallmentCountPicker } from '../installment-count-picker/installment-count-picker';

import type { InstallmentPlanUpdateFormValues } from '../../constant/installment-plan-update-form-schema.constant';
import type { UseControllerReturn } from 'react-hook-form';

interface Props {
    readonly control: Control<InstallmentPlanUpdateFormValues>;
    readonly minimumCount: number;
}

export const InstallmentPlanCountField = ({ control, minimumCount }: Props) => {
    const { t } = useLingui();

    const render = ({ field: { value, onChange } }: UseControllerReturn<InstallmentPlanUpdateFormValues, 'installmentCount'>) => (
        <InstallmentCountPicker selectedCount={value} minimumCount={minimumCount} onSelect={onChange} />
    );

    return (
        <FormItem label={t`Payments`}>
            <Controller control={control} name="installmentCount" render={render} />
        </FormItem>
    );
};
