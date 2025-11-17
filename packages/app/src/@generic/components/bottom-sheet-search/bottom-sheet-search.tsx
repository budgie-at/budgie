import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { styled } from 'nativewind';
import { ComponentProps } from 'react';
import { View } from 'react-native';

import { cn } from '../../utils/cn.util';

interface Props extends ComponentProps<typeof BottomSheetTextInput> {
    readonly inputClassName?: string;
}

const Input = styled(BottomSheetTextInput, { className: 'style' });

export const BottomSheetSearch = ({ className, inputClassName, ...rest }: Props) => (
    <View className={cn('gap-y-1 py-3xl px-xl border-t border-t-secondary-corner border-b border-b-secondary-corner', className)}>
        <Input
            className={cn(
                'rounded-5xl bg-secondary-background h-[44px] px-xl border border-secondary-corner placeholder-secondary-reverse-foreground text-primary',
                inputClassName
            )}
            {...rest}
        />
    </View>
);
