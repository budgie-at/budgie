import { useLingui } from '@lingui/react/macro';
import { Control, Controller } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { InstallmentCountChips } from '../installment-count-chips/installment-count-chips';

import type { InstallmentPlanUpdateFormValues } from '../../constant/installment-plan-update-form-schema.constant';
import type { UseControllerReturn } from 'react-hook-form';

interface Props {
    readonly control: Control<InstallmentPlanUpdateFormValues>;
    readonly minimumCount: number;
}

export const InstallmentPlanCountField = ({ control, minimumCount }: Props) => {
    const { t } = useLingui();

    const render = ({ field: { value, onChange } }: UseControllerReturn<InstallmentPlanUpdateFormValues, 'installmentCount'>) => (
        <InstallmentCountChips selectedCount={value} minimumCount={minimumCount} onSelect={onChange} />
    );

    return (
        <FormItem label={t`Payments`}>
            <Controller control={control} name="installmentCount" render={render} />
        </FormItem>
    );
};
