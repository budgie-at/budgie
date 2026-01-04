import { RuleCreateInputInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';
import { Text, View } from 'react-native';

import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';

export const RuleEnabledField = () => {
    const { control } = useFormContext<RuleCreateInputInterface>();

    const renderEnabledSwitch = ({ field: { value, onChange } }: UseControllerReturn<RuleCreateInputInterface, 'enabled'>) => (
        <View className="bg-secondary-background rounded-xl px-lg py-md border border-secondary-corner flex-row items-center justify-between">
            <Text className="text-primary text-sm">{value ? <Trans>Active</Trans> : <Trans>Inactive</Trans>}</Text>
            <ThemedSwitch value={value} onValueChange={onChange} />
        </View>
    );

    return (
        <View className="flex-1">
            <Text className="text-secondary-foreground text-xs mb-xs">
                <Trans>Enabled</Trans>
            </Text>
            <Controller control={control} name="enabled" render={renderEnabledSwitch} />
        </View>
    );
};
