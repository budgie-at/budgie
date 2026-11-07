import { Text } from 'react-native';

import { cn } from '../../utils/cn.util';

import type { PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {
    readonly isSelected: boolean;
}

export const DatePickerGridLabel = ({ children, isSelected }: Props) => (
    <Text
        className={cn('text-[17px] font-medium text-primary', isSelected && 'text-primary-reverse')}
        maxFontSizeMultiplier={1.3}
        numberOfLines={1}
        adjustsFontSizeToFit
    >
        {children}
    </Text>
);
