import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';

interface Props {
    readonly label: string;
    readonly icon?: UserIconNameEnum;
    readonly accessibilityLabel: string;
    readonly onPress: () => void;
    readonly testID?: string;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const RuleFormPickerPill = ({ label, icon, accessibilityLabel, onPress, testID }: Props) => (
    <HapticPressable
        testID={testID}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        className="min-h-[44px] max-w-full justify-center active:opacity-70"
    >
        <View className="flex-row items-center gap-x-xs rounded-full bg-surface-fill px-lg py-sm" style={CONTINUOUS_CORNERS}>
            {isDefined(icon) ? <Icon icon={icon} size={15} className="text-primary" /> : null}
            <Text className="shrink text-[15px] font-medium text-primary" numberOfLines={1} {...testIDProps(testID, TestIDPartEnum.VALUE)}>
                {label}
            </Text>
            <Icon icon={UserIconNameEnum.ChevronDown} size={12} className="text-secondary-foreground" />
        </View>
    </HapticPressable>
);
