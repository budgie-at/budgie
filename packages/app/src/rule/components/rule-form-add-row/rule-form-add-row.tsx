import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';

interface Props {
    readonly label: string;
    readonly onPress: () => void;
    readonly testID: string;
}

export const RuleFormAddRow = ({ label, onPress, testID }: Props) => (
    <HapticPressable
        testID={testID}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        className="min-h-[56px] flex-row items-center gap-x-xl px-3xl active:opacity-70"
    >
        <View className="absolute top-0 right-0 left-[16px] h-hairline bg-surface-separator" pointerEvents="none" />
        <CircleIcon
            icon={UserIconNameEnum.Plus}
            variant="primary"
            size={36}
            iconSize={18}
            radius={18}
            border={false}
            className={TONAL_DISC_BACKGROUND.primary}
        />
        <Text className="text-[17px] text-primary">{label}</Text>
    </HapticPressable>
);
