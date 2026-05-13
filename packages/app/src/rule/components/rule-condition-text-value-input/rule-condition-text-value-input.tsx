import { RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { Input } from '../../../@generic/component/input/input';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

export const RuleConditionTextValueInput = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();

    const renderValueInput = ({
        field: { value, onChange }
    }: UseControllerReturn<RuleCreateInputInterface, `conditions.${number}.value`>) => (
        <Input testID={testID} value={value} onChangeText={onChange} placeholder={t`Enter value...`} />
    );

    return (
        <FormItem label={t`Value`}>
            <Controller control={control} name={`conditions.${index}.value`} render={renderValueInput} />
        </FormItem>
    );
};
