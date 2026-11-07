import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedSurfacePaletteEnum } from '../../enum/grouped-surface-palette.enum';
import { cn } from '../../utils/cn.util';
import { GroupedSurface } from '../grouped-surface/grouped-surface';
import { SheetBottomFade } from '../sheet-bottom-fade/sheet-bottom-fade';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly className?: string;
    readonly contentClassName?: string;
    readonly header?: ReactNode;
    readonly footer?: ReactNode;
}

export const SheetSurface = ({ children, header, footer, className, contentClassName }: Props) => (
    <GroupedSurface palette={GroupedSurfacePaletteEnum.SHEET} className={className}>
        {header}
        <View className={cn('flex-1 min-h-0', contentClassName)}>
            {children}
            <SheetBottomFade />
        </View>
        {isDefined(footer) ? (
            <View className="border-t border-surface-separator bg-surface px-xl pt-md pb-safe-or-[12px]">{footer}</View>
        ) : null}
    </GroupedSurface>
);
