import { UserIconNameEnum } from '@budgie/contracts';
import React, { ComponentProps } from 'react';

import { cn } from '../../utils/cn.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

export const GoBackButton = ({ className, testID = 'GoBackButton', ...rest }: ComponentProps<typeof HapticPressable>) => (
    <HapticPressable testID={testID} className={cn('p-md', className)} {...rest}>
        <Icon icon={UserIconNameEnum.ChevronLeft} className="text-primary" size={24} />
    </HapticPressable>
);
