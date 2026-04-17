import { UserIconNameEnum } from '@budgie/contracts';
import React, { ComponentProps } from 'react';

import { cn } from '../../utils/cn.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';
import { PageHeaderSelector } from '../page-header/page-header.selector';

export const GoBackButton = ({ className, testID = PageHeaderSelector.BackButton, ...rest }: ComponentProps<typeof HapticPressable>) => (
    <HapticPressable className={cn('p-md', className)} testID={testID} {...rest}>
        <Icon icon={UserIconNameEnum.ChevronLeft} className="text-primary" size={24} />
    </HapticPressable>
);
