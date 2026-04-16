import { cva } from 'class-variance-authority';
import { ReactNode } from 'react';

import { EmptyFn } from '@rnw-community/shared';

import { HapticPressable } from '../../haptic-pressable/haptic-pressable';

interface Props {
    readonly isSelected: boolean;
    readonly onPress: EmptyFn;
    readonly children: ReactNode;
    readonly testID?: string;
}

const rowVariants = cva('flex-row items-center gap-x-lg rounded-2xl border px-lg py-md', {
    variants: {
        isSelected: {
            true: 'border-primary/60 bg-transparent',
            false: 'border-secondary-corner bg-transparent'
        }
    }
});

export const FilterRow = ({ isSelected, onPress, children, testID }: Props) => (
    <HapticPressable onPress={onPress} className={rowVariants({ isSelected })} testID={testID}>
        {children}
    </HapticPressable>
);
