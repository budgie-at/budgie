import { UserIconType } from '@budgie/contracts';
import { Text, View, useWindowDimensions } from 'react-native';

import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/row-max-font-size-multiplier.constant';
import { cn } from '../../utils/cn.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';
import { LoadingContent } from '../loading-content/loading-content';

import type { ReactNode } from 'react';

interface Props {
    readonly label: string;
    readonly icon: UserIconType;
    readonly onPress: () => void;
    readonly isDisabled: boolean;
    readonly isLoading: boolean;
    readonly labelClassName: string;
    readonly trailing?: ReactNode;
    readonly testID?: string;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const GroupedListActionRow = ({ label, icon, onPress, isDisabled, isLoading, labelClassName, trailing, testID }: Props) => {
    const { fontScale } = useWindowDimensions();
    const isInactive = isDisabled || isLoading;
    const iconSize = Math.round(20 * Math.min(fontScale, ROW_MAX_FONT_SIZE_MULTIPLIER));
    const accessibilityState = { disabled: isInactive, busy: isLoading };

    return (
        <HapticPressable
            pressedScale={1}
            onPress={onPress}
            disabled={isInactive}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={accessibilityState}
            className={cn(
                'min-h-[50px] justify-center rounded-3xl bg-surface-row px-3xl py-lg active:opacity-70',
                isDisabled && !isLoading && 'opacity-40'
            )}
            style={CONTINUOUS_CORNERS}
            testID={testID}
        >
            <LoadingContent isLoading={isLoading}>
                <View className="flex-row items-center gap-x-md">
                    <Icon icon={icon} size={iconSize} className={labelClassName} />
                    <Text maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER} className={cn('flex-1 text-[17px]', labelClassName)}>
                        {label}
                    </Text>
                    {trailing}
                </View>
            </LoadingContent>
        </HapticPressable>
    );
};
