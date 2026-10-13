import { cva } from 'class-variance-authority';
import { TextInput } from 'react-native';

import { cn } from '../../utils/cn.util';

import type { FormFieldStatus } from '../../type/form-field-status.type';
import type { ComponentProps, RefObject } from 'react';

type BaseTextInputProps = Omit<ComponentProps<typeof TextInput>, 'multiline' | 'style' | 'ref'>;

interface Props extends BaseTextInputProps {
    readonly status?: FormFieldStatus;
    readonly borderless?: boolean;
    readonly size?: 'sm' | 'md' | 'lg';
    readonly minLines?: 1 | 2;
    readonly maxLines?: 2 | 3 | 4 | 5;
    readonly ref?: RefObject<TextInput | null>;
}

const TEXT_AREA_DIMENSIONS = {
    sm: { baseHeight: 36, lineDelta: 20 },
    md: { baseHeight: 44, lineDelta: 22 },
    lg: { baseHeight: 62, lineDelta: 28 }
} as const;

const textAreaVariant = cva('text-primary rounded-2xl', {
    variants: {
        size: {
            sm: 'px-xl py-md text-md',
            md: 'px-xl py-md text-md',
            lg: 'px-4xl py-lg text-lg'
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

export const TextArea = (props: Props) => {
    const { size = 'sm', status = 'default', borderless = false, minLines = 1, maxLines = 2, className, ref, ...rest } = props;

    const { baseHeight, lineDelta } = TEXT_AREA_DIMENSIONS[size];
    const minHeight = baseHeight + (minLines - 1) * lineDelta;
    const maxHeight = baseHeight + (maxLines - 1) * lineDelta;
    const containerStyle = { minHeight, maxHeight };

    return (
        <TextInput
            placeholderTextColorClassName="accent-primary/50"
            {...rest}
            ref={ref}
            multiline
            textAlignVertical="top"
            scrollEnabled
            style={containerStyle}
            className={cn(textAreaVariant({ size, status, borderless }), className)}
        />
    );
};
