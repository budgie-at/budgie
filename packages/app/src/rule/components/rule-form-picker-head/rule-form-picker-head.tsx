import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';

import type { RuleOptionMetaInterface } from '../../interface/rule-option-meta.interface';

interface Props {
    readonly meta: Pick<RuleOptionMetaInterface, 'icon' | 'variant'>;
    readonly label: string;
    readonly accessibilityLabel: string;
    readonly onPress: () => void;
    readonly testID?: string;
}

export const RuleFormPickerHead = ({ meta, label, accessibilityLabel, onPress, testID }: Props) => (
    <HapticPressable
        testID={testID}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        className="min-h-[44px] min-w-0 flex-1 flex-row items-center gap-x-xl active:opacity-70"
    >
        <CircleIcon
            icon={meta.icon}
            variant={meta.variant}
            size={36}
            iconSize={18}
            radius={18}
            border={false}
            className={TONAL_DISC_BACKGROUND[meta.variant]}
        />
        <View className="min-w-0 flex-1 flex-row items-center gap-x-xs">
            <Text className="shrink text-[17px] text-primary" numberOfLines={1} {...testIDProps(testID, TestIDPartEnum.VALUE)}>
                {label}
            </Text>
            <Icon icon={UserIconNameEnum.ChevronDown} size={14} className="text-secondary-foreground" />
        </View>
    </HapticPressable>
);
