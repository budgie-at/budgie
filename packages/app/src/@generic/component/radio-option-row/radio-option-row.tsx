import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { MAX_FONT_SIZE_MULTIPLIER } from '../../constant/max-font-size-multiplier.constant';
import { cn } from '../../utils/cn.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

import type { ReactNode } from 'react';

interface Props {
    readonly label: string;
    readonly isSelected: boolean;
    readonly onPress: () => void;
    readonly description?: string;
    readonly children?: ReactNode;
    readonly testID?: string;
}

export const RadioOptionRow = ({ label, isSelected, onPress, description, children, testID }: Props) => {
    const indicatorClassName = isSelected ? 'border-[6px] border-primary' : 'border-[1.5px] border-secondary-foreground';

    const accessibilityState = { selected: isSelected };

    return (
        <View className="gap-y-md py-md">
            <HapticPressable
                accessibilityLabel={label}
                accessibilityRole="radio"
                accessibilityState={accessibilityState}
                className="flex-row items-start gap-x-xl active:opacity-70"
                testID={testID}
                onPress={onPress}
            >
                <View className={cn('mt-[1px] h-[20px] w-[20px] rounded-full', indicatorClassName)} />
                <View className="flex-1 gap-y-xs">
                    <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className="text-md font-medium text-primary">
                        {label}
                    </Text>
                    {isNotEmptyString(description) ? (
                        <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className="text-xs text-secondary-foreground">
                            {description}
                        </Text>
                    ) : null}
                </View>
            </HapticPressable>
            {isDefined(children) ? <View className="pl-[32px]">{children}</View> : null}
        </View>
    );
};
