import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import React, { ComponentProps } from 'react';

import { cn } from '../../utils/cn.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';
import { PageHeaderSelector } from '../page-header/page-header.selector';

export const GoBackButton = ({
    accessibilityLabel,
    accessibilityRole = 'button',
    className,
    testID = PageHeaderSelector.BackButton,
    ...rest
}: ComponentProps<typeof HapticPressable>) => {
    const { t } = useLingui();
    const resolvedAccessibilityLabel = accessibilityLabel ?? t`Go back`;

    return (
        <HapticPressable
            accessible
            accessibilityLabel={resolvedAccessibilityLabel}
            accessibilityRole={accessibilityRole}
            className={cn('p-md', className)}
            collapsable={false}
            testID={testID}
            {...rest}
        >
            <Icon icon={UserIconNameEnum.ChevronLeft} className="text-primary" size={24} />
        </HapticPressable>
    );
};
