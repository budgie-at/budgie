import { BottomSheetFlatList as GorhomBottomSheetFlatList } from '@gorhom/bottom-sheet';
import { styled } from 'nativewind';
import { ComponentProps } from 'react';

interface Props extends ComponentProps<typeof GorhomBottomSheetFlatList> {
    readonly className?: string;
    readonly contentContainerClassName?: string;
}

const Wrapper = styled(GorhomBottomSheetFlatList, {
    className: 'style',
    contentContainerClassName: 'contentContainerStyle'
});

export const BottomSheetFlatList = ({ children, ...rest }: Props) => (
    <Wrapper showsVerticalScrollIndicator={false} {...rest}>
        {children}
    </Wrapper>
);
