import { GroupedSurfacePaletteEnum } from '../../enum/grouped-surface-palette.enum';
import { GroupedSurface } from '../grouped-surface/grouped-surface';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const FittedSheetSurface = ({ children }: Props) => (
    <GroupedSurface palette={GroupedSurfacePaletteEnum.SHEET} className="flex-none">
        {children}
    </GroupedSurface>
);
