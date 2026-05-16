import type { UserIconNameEnum } from '@budgie/contracts';
import type { ReactNode } from 'react';

export interface RuleIndicatorPillPropsInterface {
    readonly children: ReactNode;
    readonly icon: UserIconNameEnum;
    readonly className?: string;
    readonly iconClassName?: string;
    readonly textClassName?: string;
    readonly trailingContent?: ReactNode;
}
