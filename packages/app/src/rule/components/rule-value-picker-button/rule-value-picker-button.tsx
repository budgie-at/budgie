import { UserIconNameEnum } from '@budgie/contracts';
import { Text } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';

interface Props {
    readonly value: string | null;
    readonly placeholder: string;
    readonly name: string;
    readonly isMissing: boolean;
    readonly onPress: () => void;
    readonly testID?: string;
}

export const RuleValuePickerButton = ({ value, placeholder, name, isMissing, onPress, testID }: Props) => {
    const hasValue = isNotEmptyString(value);
    const label = hasValue ? value : placeholder;
    const placeholderClassName = isMissing ? 'flex-1 text-[17px] text-warning-foreground' : 'flex-1 text-[17px] text-secondary-foreground';
    const labelClassName = hasValue ? 'flex-1 text-[17px] text-primary' : placeholderClassName;

    return (
        <HapticPressable
            testID={testID}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${name}: ${label}`}
            className="min-h-[48px] flex-1 flex-row items-center gap-x-md active:opacity-70"
        >
            <Text className={labelClassName} numberOfLines={1} {...testIDProps(testID, TestIDPartEnum.VALUE)}>
                {label}
            </Text>
            <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
        </HapticPressable>
    );
};
