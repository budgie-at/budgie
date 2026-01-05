import { UserIconNameEnum } from '@budgie/contracts';
import { ComponentProps } from 'react';
import { View } from 'react-native';

import { cn } from '../../utils/cn.util';
import { BottomSheetTextInput } from '../bottom-sheet-text-input/bottom-sheet-text-input';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface RightActionProps {
    readonly icon: UserIconNameEnum;
    readonly onPress: () => void;
}

interface Props extends ComponentProps<typeof BottomSheetTextInput> {
    readonly inputClassName?: string;
    readonly rightAction?: RightActionProps;
}

export const BottomSheetSearch = ({ className, inputClassName, rightAction, ...rest }: Props) => (
    <View className={cn('py-3xl px-xl border-t border-t-secondary-corner border-b border-b-secondary-corner', className)}>
        <View className="flex-row items-center gap-x-md">
            <BottomSheetTextInput
                className={cn(
                    'flex-1 rounded-5xl bg-secondary-background h-[44px] px-xl border border-secondary-corner placeholder-secondary-reverse-foreground text-primary',
                    inputClassName
                )}
                {...rest}
            />
            {rightAction && (
                <HapticPressable
                    onPress={rightAction.onPress}
                    className="h-[44px] w-[44px] items-center justify-center rounded-full bg-white"
                >
                    <Icon icon={rightAction.icon} size={20} className="text-black" />
                </HapticPressable>
            )}
        </View>
    </View>
);
