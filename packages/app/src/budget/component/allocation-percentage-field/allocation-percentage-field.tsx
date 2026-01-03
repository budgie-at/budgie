import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { FormPercentageInput } from '../../../@generic/component/form-percentage-input/form-percentage-input';
import { AllocationFormValues } from '../../schema/allocation-form.schema';

interface Props {
    readonly control: Control<AllocationFormValues>;
}

export const AllocationPercentageField = ({ control }: Props) => {
    const { t } = useLingui();

    const renderPercentage = ({
        field: { onChange, value },
        fieldState: { error }
    }: UseControllerReturn<AllocationFormValues, 'percentage'>) => (
        <FormItem label={t`Percentage of Income`} error={error?.message}>
            <FormPercentageInput value={value} onChange={onChange} variant="primary" />
        </FormItem>
    );

    return <Controller name="percentage" control={control} render={renderPercentage} />;
};
