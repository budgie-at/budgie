import { Text } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { FormItem } from '../form-item/form-item';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

interface Props {
    readonly label: string;
    readonly value: string;
    readonly onPress: EmptyFn;
    readonly testID?: string;
}

export const FormSelectorField = ({ label, value, onPress, testID }: Props) => (
    <FormItem label={label}>
        <HapticPressable
            testID={testID}
            onPress={onPress}
            className="bg-secondary-background rounded-xl px-lg py-md border border-secondary-corner"
        >
            <Text className="text-primary text-sm">{value}</Text>
        </HapticPressable>
    </FormItem>
);
