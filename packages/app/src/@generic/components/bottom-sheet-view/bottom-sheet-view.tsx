import { BottomSheetView as GorhomBottomSheetView } from '@gorhom/bottom-sheet';
import { ComponentProps } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props extends ComponentProps<typeof GorhomBottomSheetView> {
    readonly className?: string;
    readonly hasFooter?: boolean;
}

export const BottomSheetView = ({ children, hasFooter, className, ...rest }: Props) => {
    const { bottom } = useSafeAreaInsets();

    const style = { paddingBottom: bottom };

    return (
        <GorhomBottomSheetView style={style} {...rest}>
            <View className={className}>{children}</View>
        </GorhomBottomSheetView>
    );
};
