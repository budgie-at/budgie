import { DebtAccountCreateInputInterface, LiabilityAccountCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, FieldPath, FieldValues, Path, UseControllerReturn } from 'react-hook-form';
import { Text } from 'react-native';

import { AccountFormSelectors } from '../../../@e2e/selectors/account-form.selector';
import { HorizontalCell } from '../../../@generic/component/horizontal-cell/horizontal-cell';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';

interface Props<T extends FieldValues> {
    readonly control: Control<T>;
}

export const AccountActiveToggleField = <T extends LiabilityAccountCreateInputInterface | DebtAccountCreateInputInterface>({
    control
}: Props<T>) => {
    const { t } = useLingui();

    const renderField = ({ field: { value, onChange } }: UseControllerReturn<T, FieldPath<T>>) => {
        const handlePress = () => void onChange(!(value as boolean));

        return (
            <HorizontalCell
                onPress={handlePress}
                testID={AccountFormSelectors.ActiveRow}
                right={
                    <ThemedSwitch
                        className="my-auto"
                        onValueChange={onChange}
                        value={value as boolean}
                        testID={AccountFormSelectors.ActiveSwitch}
                    />
                }
            >
                <Text className="text-sm font-medium text-primary" testID={AccountFormSelectors.ActiveTitle}>
                    {t`Active`}
                </Text>
                <Text className="text-sm font-medium text-secondary-foreground">{t`Show this account on the main page`}</Text>
            </HorizontalCell>
        );
    };

    return <Controller control={control} name={'isActive' as Path<T>} render={renderField} />;
};
