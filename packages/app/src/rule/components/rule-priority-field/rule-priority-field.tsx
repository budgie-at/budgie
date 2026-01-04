import { RuleCreateInputInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';
import { Text, View } from 'react-native';

import { RuleTextInput } from '../rule-text-input/rule-text-input';

export const RulePriorityField = () => {
    const { control } = useFormContext<RuleCreateInputInterface>();

    const renderPriorityInput = ({ field: { value, onChange } }: UseControllerReturn<RuleCreateInputInterface, 'priority'>) => {
        const handleChange = (text: string) => void onChange(parseInt(text, 10) || 0);

        return <RuleTextInput value={String(value)} onChange={handleChange} placeholder="0" keyboardType="numeric" />;
    };

    return (
        <View className="flex-1">
            <Text className="text-secondary-foreground text-xs mb-xs">
                <Trans>Priority</Trans>
            </Text>
            <Controller control={control} name="priority" render={renderPriorityInput} />
        </View>
    );
};
