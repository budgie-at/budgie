import { cva } from 'class-variance-authority';
import { ComponentProps } from 'react';
import { TextInput } from 'react-native';

import { cn } from '../../utils/cn.util';

interface Props extends ComponentProps<typeof TextInput> {
    readonly variant?: 'default' | 'destructive';
    readonly size?: 'sm' | 'md' | 'lg';
}

const inputVariant = cva('text-primary placeholder-primary/50 rounded-2xl', {
    variants: {
        size: {
            sm: 'h-[36px] px-xl text-md/1',
            md: 'h-[44px] px-xl text-md/1',
            lg: 'h-[62px] px-4xl text-lg/1'
        },
        variant: {
            destructive: 'border border-destructive-corner bg-destructive-background text-destructive-foreground',
            default: 'border border-secondary-corner'
        }
    }
});

export const Input = ({ size = 'sm', variant = 'default', style, ...rest }: Props) => (
    <TextInput {...rest} className={cn(inputVariant({ size, variant }))} />
);
