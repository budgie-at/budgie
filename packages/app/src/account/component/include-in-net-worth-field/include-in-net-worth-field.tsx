import { useLingui } from '@lingui/react/macro';
import { Control, Controller, Path, UseControllerReturn } from 'react-hook-form';

import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';

interface Props<T extends { includeInNetWorth?: boolean }> {
    readonly control: Control<T>;
}

export const IncludeInNetWorthField = <T extends { includeInNetWorth?: boolean }>({ control }: Props<T>) => {
    const { t } = useLingui();

    const render = ({ field: { value, onChange } }: UseControllerReturn<T, Path<T>>) => (
        <ThemedSwitch className='my-auto' value={value} onValueChange={onChange} />
    );

    return (
        <SimpleHorizontalCell
            right={<Controller control={control} name={'includeInNetWorth' as Path<T>} render={render} />}
            description={t`Count this account in your net worth calculation`}
            title={t`Include in Net Worth`}
        />
    );
};
