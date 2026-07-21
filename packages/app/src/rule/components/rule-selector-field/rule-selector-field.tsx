import { Text } from 'react-native';

import { EmptyFn, isNotEmptyString } from '@rnw-community/shared';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';

interface Props {
    readonly label: string;
    readonly value: string;
    readonly onPress: EmptyFn;
    readonly hint?: string;
    readonly testID?: string;
}

export const RuleSelectorField = ({ label, value, onPress, hint, testID }: Props) => (
    <FormItem label={label}>
        <HapticPressable
            testID={testID}
            onPress={onPress}
            className="bg-secondary-background rounded-xl px-lg py-md border border-secondary-corner"
        >
            <Text className="text-primary text-sm" {...testIDProps(testID, TestIDPartEnum.VALUE)}>
                {value}
            </Text>
        </HapticPressable>

        {isNotEmptyString(hint) ? <Text className="text-secondary-foreground text-xs">{hint}</Text> : null}
    </FormItem>
);
