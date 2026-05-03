import { cva } from 'class-variance-authority';
import { TextInput } from 'react-native';

import { cn } from '../../utils/cn.util';

import { TEXT_AREA_BASE_HEIGHTS } from './constant/text-area-base-heights.constant';
import { TEXT_AREA_LINE_DELTAS } from './constant/text-area-line-deltas.constant';

import type { TextAreaProps } from './interface/text-area-props.interface';

const textAreaVariant = cva('text-primary placeholder-primary/50 rounded-2xl', {
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

export const TextArea = (props: TextAreaProps) => {
    const { size = 'sm', status = 'default', borderless = false, minLines = 1, maxLines = 2, className, ref, ...rest } = props;

    const baseHeight = TEXT_AREA_BASE_HEIGHTS[size];
    const lineDelta = TEXT_AREA_LINE_DELTAS[size];
    const minHeight = baseHeight + (minLines - 1) * lineDelta;
    const maxHeight = baseHeight + (maxLines - 1) * lineDelta;
    const containerStyle = { minHeight, maxHeight };

    return (
        <TextInput
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
