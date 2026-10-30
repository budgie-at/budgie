import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';

import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconType;
    readonly label?: string;
    readonly value?: string | null;
    readonly description?: string | null;
    readonly trailing?: string | null;
    readonly valueClassName?: string;
    readonly testID: string;
    readonly onPress?: () => void;
}

export const TransactionInfoRow = (props: Props) => {
    const { icon, label, value, description, trailing, valueClassName, testID, onPress } = props;
    const rowContent = (
        <>
            <View className="absolute top-0 right-0 left-[56px] h-hairline bg-surface-separator" pointerEvents="none" />

            <View className="h-[28px] w-[28px] items-center justify-center">
                <Icon icon={icon} size={22} className="text-secondary-foreground" />
            </View>

            <View className="flex-1 min-w-0">
                {isNotEmptyString(label) ? <Text className="text-[13px] leading-[18px] text-secondary-foreground">{label}</Text> : null}
                {isNotEmptyString(value) ? (
                    <Text className={cn('text-[17px] leading-[22px] text-primary font-medium', valueClassName)} selectable>
                        {value}
                    </Text>
                ) : null}
                {isNotEmptyString(description) ? (
                    <Text className="text-[13px] leading-[18px] text-secondary-foreground" selectable>
                        {description}
                    </Text>
                ) : null}
            </View>

            {isNotEmptyString(trailing) ? (
                <Text className="shrink-0 text-[17px] leading-[22px] text-primary font-medium text-right tabular-nums" selectable>
                    {trailing}
                </Text>
            ) : null}

            {isDefined(onPress) ? <Icon icon={UserIconNameEnum.ChevronRight} size={20} className="text-secondary-foreground" /> : null}
        </>
    );
    const rowClassName = 'min-h-[56px] flex-row items-center gap-x-xl px-3xl py-xl';

    if (isDefined(onPress)) {
        return (
            <HapticPressable
                accessibilityRole="button"
                accessibilityLabel={[label, value, description].filter(isNotEmptyString).join(', ')}
                onPress={onPress}
                className="active:scale-100 active:opacity-70"
            >
                <View className={rowClassName} collapsable={false} nativeID={testID} testID={testID}>
                    {rowContent}
                </View>
            </HapticPressable>
        );
    }

    return (
        <View className={rowClassName} collapsable={false} nativeID={testID} testID={testID}>
            {rowContent}
        </View>
    );
};
