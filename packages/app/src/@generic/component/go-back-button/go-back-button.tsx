import React, { ComponentProps } from 'react';
import { cn } from '../../utils/cn.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

export const GoBackButton = ({ className, ...rest }: ComponentProps<typeof HapticPressable>) => (
    <HapticPressable className={cn('p-md', className)} {...rest}>
        <Icon icon="ChevronLeft" className="text-primary" size={24} />
    </HapticPressable>
);
