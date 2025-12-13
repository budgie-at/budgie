import { BottomSheetView as GorhomBottomSheetView } from '@gorhom/bottom-sheet';
import { styled } from 'nativewind';
import { ComponentProps } from 'react';

const Wrapper = styled(GorhomBottomSheetView, {
    className: 'style'
});

export const BottomSheetView = ({ children, ...props }: ComponentProps<typeof GorhomBottomSheetView>) => <Wrapper {...props}>{children}</Wrapper>;

