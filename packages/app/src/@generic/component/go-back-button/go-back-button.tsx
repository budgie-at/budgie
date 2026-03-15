import { UserIconNameEnum } from '@budgie/contracts';
import React, { ComponentProps } from 'react';

import { PageHeaderSelectors } from '../../../@e2e/selectors/page-header.selector';
import { cn } from '../../utils/cn.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

export const GoBackButton = ({ className, testID = PageHeaderSelectors.BackButton, ...rest }: ComponentProps<typeof HapticPressable>) => (
    <HapticPressable className={cn('p-md', className)} testID={testID} {...rest}>
        <Icon icon={UserIconNameEnum.ChevronLeft} className="text-primary" size={24} />
    </HapticPressable>
);
