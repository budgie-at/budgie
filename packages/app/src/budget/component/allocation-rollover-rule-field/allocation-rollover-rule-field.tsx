import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { AllocationFormValues } from '../../schema/allocation-form.schema';
import { RolloverRuleSelector } from '../rollover-rule-selector/rollover-rule-selector';

interface Props {
    readonly control: Control<AllocationFormValues>;
}

export const AllocationRolloverRuleField = ({ control }: Props) => {
    const { t } = useLingui();

    const renderRolloverRule = ({ field: { onChange, value } }: UseControllerReturn<AllocationFormValues, 'rolloverRule'>) => (
        <FormItem label={t`Rollover Rule`}>
            <RolloverRuleSelector value={value} onChange={onChange} />
        </FormItem>
    );

    return <Controller name="rolloverRule" control={control} render={renderRolloverRule} />;
};
