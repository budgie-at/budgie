import { Text } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';

interface Props {
    readonly value: string;
    readonly onPress: EmptyFn;
    readonly testID?: string;
}

export const RuleSelectorButton = ({ value, onPress, testID }: Props) => (
    <HapticPressable
        testID={testID}
        onPress={onPress}
        className="bg-secondary-background rounded-xl px-lg py-md border border-secondary-corner"
    >
        <Text className="text-primary text-sm" {...testIDProps(testID, TestIDPartEnum.VALUE)}>
            {value}
        </Text>
    </HapticPressable>
);
