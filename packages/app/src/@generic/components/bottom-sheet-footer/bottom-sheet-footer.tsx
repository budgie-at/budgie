import { BottomSheetFooter as GorhomBottomSheetFooter } from '@gorhom/bottom-sheet';
import { ComponentProps } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props extends ComponentProps<typeof GorhomBottomSheetFooter> {
    readonly className?: string;
    readonly contentContainerClassName?: string;
}

export const BottomSheetFooter = ({ children, className, ...rest }: Props) => {
    const { bottom } = useSafeAreaInsets();

    const style = { paddingBottom: bottom };

    return (
        <GorhomBottomSheetFooter style={style} {...rest}>
            <View className={className}>{children}</View>
        </GorhomBottomSheetFooter>
    );
};
