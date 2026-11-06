import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedSurfacePaletteEnum } from '../../enum/grouped-surface-palette.enum';
import { GroupedSurface } from '../grouped-surface/grouped-surface';
import { SheetBottomFade } from '../sheet-bottom-fade/sheet-bottom-fade';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly header?: ReactNode;
    readonly footer?: ReactNode;
}

export const SheetSurface = ({ children, header, footer }: Props) => (
    <GroupedSurface palette={GroupedSurfacePaletteEnum.SHEET}>
        {header}
        <View className="flex-1 min-h-0">
            {children}
            <SheetBottomFade />
        </View>
        {isDefined(footer) ? (
            <View className="border-t border-surface-separator bg-surface px-xl pt-md pb-safe-or-[12px]">{footer}</View>
        ) : null}
    </GroupedSurface>
);
