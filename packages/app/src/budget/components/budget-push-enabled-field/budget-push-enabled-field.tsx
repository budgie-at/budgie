import { Trans, useLingui } from '@lingui/react/macro';
import * as Notifications from 'expo-notifications';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';

interface Props {
    readonly control: Control<BudgetFormValues>;
}

export const BudgetPushEnabledField = ({ control }: Props) => {
    const { t } = useLingui();

    const render = ({ field: { value, onChange } }: UseControllerReturn<BudgetFormValues, 'pushEnabled'>) => {
        const handleChange = async (next: boolean) => {
            if (!next) {
                onChange(false);

                return;
            }

            const { status } = await Notifications.requestPermissionsAsync();

            if (status === Notifications.PermissionStatus.GRANTED) {
                onChange(true);
            } else {
                onChange(false);
                Toast.show({
                    type: 'error',
                    text1: t`Push notifications are disabled`,
                    text2: t`Enable them in device settings to receive budget alerts.`
                });
            }
        };

        return <ThemedSwitch testID={BudgetSelector.SetupPushToggle} value={value} onValueChange={handleChange} />;
    };

    return (
        <View className="flex-row items-center justify-between gap-x-md">
            <View className="flex-1">
                <Text className="text-primary font-medium text-md">
                    <Trans>Send push notifications</Trans>
                </Text>
                <Text className="text-secondary-foreground text-sm">
                    <Trans>Get notified when the app is closed and a budget threshold is crossed</Trans>
                </Text>
            </View>

            <Controller control={control} name="pushEnabled" render={render} />
        </View>
    );
};
