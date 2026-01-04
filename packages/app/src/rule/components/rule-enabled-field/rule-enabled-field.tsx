import { RuleCreateInputInterface } from '@budgie/contracts';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';

import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';

export const RuleEnabledField = () => {
    const { control } = useFormContext<RuleCreateInputInterface>();

    const renderEnabledSwitch = ({ field: { value, onChange } }: UseControllerReturn<RuleCreateInputInterface, 'enabled'>) => (
        <ThemedSwitch className='my-auto' value={value} onValueChange={onChange} />
    );

    return <Controller control={control} name="enabled" render={renderEnabledSwitch} />;
};
