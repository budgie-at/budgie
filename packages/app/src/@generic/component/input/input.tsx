import { cva } from 'class-variance-authority';
import { ComponentProps } from 'react';
import { TextInput } from 'react-native';

import { FormFieldStatus } from '../../type/form-field-status.type';
import { cn } from '../../utils/cn.util';

interface Props extends ComponentProps<typeof TextInput> {
    readonly status?: FormFieldStatus;
    readonly borderless?: boolean;
    readonly size?: 'sm' | 'md' | 'lg';
}

const inputVariant = cva('text-primary rounded-2xl', {
    variants: {
        size: {
            sm: 'h-[36px] px-xl text-md',
            md: 'h-[44px] px-xl text-md',
            lg: 'h-[62px] px-4xl text-[18px]'
        },
        status: {
            error: 'border border-destructive-corner bg-destructive-background/5 text-destructive-foreground',
            default: 'border border-secondary-corner'
        },
        borderless: {
            true: 'border-0',
            false: ''
        }
    }
});

export const Input = ({ size = 'sm', status = 'default', borderless = false, className, ...rest }: Props) => (
    <TextInput
        placeholderTextColorClassName="accent-primary/50"
        {...rest}
        className={cn(inputVariant({ size, status, borderless }), className)}
    />
);
