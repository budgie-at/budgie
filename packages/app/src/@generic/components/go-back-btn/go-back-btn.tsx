import React, { ComponentProps } from 'react';

import { ICONS } from '../../constant/icons.constant';
import { cn } from '../../utils/cn.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

export const GoBackBtn = ({ className, ...rest }: ComponentProps<typeof HapticPressable>) => (
    <HapticPressable className={cn('p-md', className)} {...rest}>
        <Icon icon={ICONS.ChevronLeft} className="text-primary" size={24} />
    </HapticPressable>
);
