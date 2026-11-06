import { UserIconNameEnum } from '@budgie/contracts';
import { Text, useWindowDimensions, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { TRANSACTION_KEYPAD_MAX_FONT_SCALE } from '../../constant/transaction-keypad-max-font-scale.constant';
import { getTransactionKeypadLayout } from '../../utils/get-transaction-keypad-layout.util';

interface Props {
    readonly label: string;
    readonly isDisabled: boolean;
    readonly onPress: () => void;
    readonly testID?: string;
}

export const TransactionKeypadConfirmButton = ({ label, isDisabled, onPress, testID }: Props) => {
    const backgroundClassName = isDisabled ? 'bg-positive-action/25' : 'bg-positive-action active:opacity-80';
    const contentClassName = isDisabled ? 'text-secondary-foreground' : 'text-white';
    const accessibilityState = { disabled: isDisabled };
    const { fontScale } = useWindowDimensions();
    const iconSize = 20 * Math.min(fontScale, TRANSACTION_KEYPAD_MAX_FONT_SCALE);
    const style = { ...getTransactionKeypadLayout(fontScale).confirmRowStyle, borderCurve: 'continuous' } as const;

    return (
        <HapticPressable
            accessibilityLabel={label}
            accessibilityRole="button"
            accessibilityState={accessibilityState}
            className={cn('items-center justify-center self-stretch rounded-xl', backgroundClassName)}
            disabled={isDisabled}
            onPress={onPress}
            style={style}
            testID={testID}
        >
            <View className="max-w-full flex-row items-center justify-center gap-x-sm px-lg">
                <Icon className={contentClassName} icon={UserIconNameEnum.Check} size={iconSize} />
                <Text
                    className={cn('min-w-0 shrink text-[17px] font-semibold', contentClassName)}
                    maxFontSizeMultiplier={2}
                    numberOfLines={2}
                >
                    {label}
                </Text>
            </View>
        </HapticPressable>
    );
};
