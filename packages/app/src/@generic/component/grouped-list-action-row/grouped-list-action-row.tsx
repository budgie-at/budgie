import { UserIconType } from '@budgie/contracts';
import { Text, View } from 'react-native';

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
    const isInactive = isDisabled || isLoading;
    const accessibilityState = { disabled: isInactive, busy: isLoading };

    return (
        <HapticPressable
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
                    <Icon icon={icon} size={20} className={labelClassName} />
                    <Text className={cn('flex-1 text-[17px]', labelClassName)}>{label}</Text>
                    {trailing}
                </View>
            </LoadingContent>
        </HapticPressable>
    );
};
