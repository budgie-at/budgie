import { DebtAccountCreateInputInterface, LiabilityAccountCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, FieldPath, FieldValues, Path, UseControllerReturn } from 'react-hook-form';
import { Text } from 'react-native';

import { HorizontalCell } from '../../../@generic/component/horizontal-cell/horizontal-cell';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';

interface Props<T extends FieldValues> {
    readonly control: Control<T>;
}

export const AccountActiveToggleField = <T extends LiabilityAccountCreateInputInterface | DebtAccountCreateInputInterface>({
    control
}: Props<T>) => {
    const { t } = useLingui();

    const renderField = ({ field: { value, onChange } }: UseControllerReturn<T, FieldPath<T>>) => (
        <HorizontalCell right={<ThemedSwitch className="my-auto" onValueChange={onChange} value={value as boolean} />}>
            <Text className="text-sm font-medium text-primary">{t`Active`}</Text>
            <Text className="text-sm font-medium text-secondary-foreground">{t`Show this account on the main page`}</Text>
        </HorizontalCell>
    );

    return <Controller control={control} name={'isActive' as Path<T>} render={renderField} />;
};
