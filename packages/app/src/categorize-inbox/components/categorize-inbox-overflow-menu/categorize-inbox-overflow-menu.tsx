import { UserIconNameEnum } from '@budgie/contracts';

import { ActionsMenu } from '../../../@generic/component/actions-menu/actions-menu';
import { Icon } from '../../../@generic/component/icon/icon';

import type { ReactNode } from 'react';

interface Props {
    readonly accessibilityLabel: string;
    readonly triggerTestID?: string;
    readonly children: ReactNode;
}

export const CategorizeInboxOverflowMenu = ({ accessibilityLabel, triggerTestID, children }: Props) => (
    <ActionsMenu
        trigger={<Icon icon={UserIconNameEnum.Ellipsis} size={18} className="text-secondary-foreground" />}
        accessibilityLabel={accessibilityLabel}
        triggerClassName="h-11 w-11 items-center justify-center rounded-xl border border-secondary-corner"
        triggerTestID={triggerTestID}
        hitSlop={0}
    >
        {children}
    </ActionsMenu>
);
