import { BottomSheetScrollView as GorhomBottomSheetScrollView } from '@gorhom/bottom-sheet';
import { styled } from 'nativewind';
import { ComponentProps } from 'react';

interface Props extends ComponentProps<typeof GorhomBottomSheetScrollView> {
    readonly className?: string;
    readonly contentContainerClassName?: string;
}

const Wrapper = styled(GorhomBottomSheetScrollView, {
    className: 'style',
    contentContainerClassName: 'contentContainerStyle'
});

export const BottomSheetScrollView = ({ children, ...rest }: Props) => (
    <Wrapper showsVerticalScrollIndicator={false} {...rest}>
        {children}
    </Wrapper>
);
