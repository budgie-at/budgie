import { createContext } from 'react';

import type { MorphingSheetDragInterface } from '../interface/morphing-sheet-drag.interface';

export const MorphingSheetDragContext = createContext<MorphingSheetDragInterface | null>(null);
