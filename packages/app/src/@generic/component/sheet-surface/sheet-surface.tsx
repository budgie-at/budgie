import { GroupedSurfacePaletteEnum } from '../../enum/grouped-surface-palette.enum';
import { GroupedSurface } from '../grouped-surface/grouped-surface';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const SheetSurface = ({ children }: Props) => <GroupedSurface palette={GroupedSurfacePaletteEnum.SHEET}>{children}</GroupedSurface>;
