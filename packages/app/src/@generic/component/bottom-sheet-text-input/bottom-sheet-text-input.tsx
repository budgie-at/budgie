import { BottomSheetTextInput as GorhomBottomSheetTextInput } from '@gorhom/bottom-sheet';
import { styled } from 'nativewind';
import { ComponentProps } from 'react';

import { cn } from '../../utils/cn.util';
import { InputProps, inputVariant } from '../input/input';

interface Props extends ComponentProps<typeof GorhomBottomSheetTextInput>, InputProps {}

const StyledTextInput = styled(GorhomBottomSheetTextInput, {
    className: 'style'
});

export const BottomSheetTextInput = ({ className, size = 'sm', status = 'default', ...rest }: Props) => (
    <StyledTextInput className={cn(inputVariant({ size, status }), className)} {...rest} />
);
