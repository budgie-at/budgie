import { BottomSheetView as GorhomBottomSheetView } from '@gorhom/bottom-sheet';
import { styled } from 'nativewind';
import { ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props extends ComponentProps<typeof GorhomBottomSheetView> {
    readonly className?: string;
}

const Wrapper = styled(GorhomBottomSheetView, {
    className: 'style'
});

export const BottomSheetView = ({ children, ...rest }: Props) => {
    const { bottom } = useSafeAreaInsets();

    const style = { paddingBottom: bottom, paddingInline: 20 };

    return (
        <Wrapper style={style} {...rest}>
            {children}
        </Wrapper>
    );
};
