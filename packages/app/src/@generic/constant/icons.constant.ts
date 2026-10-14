import { ICON_IMPORTS_CHUNK_1 } from './icons/icons-001.constant';
import { ICON_IMPORTS_CHUNK_2 } from './icons/icons-002.constant';
import { ICON_IMPORTS_CHUNK_3 } from './icons/icons-003.constant';
import { ICON_IMPORTS_CHUNK_4 } from './icons/icons-004.constant';
import { ICON_IMPORTS_CHUNK_5 } from './icons/icons-005.constant';
import { ICON_IMPORTS_CHUNK_6 } from './icons/icons-006.constant';
import { ICON_IMPORTS_CHUNK_7 } from './icons/icons-007.constant';
import { ICON_IMPORTS_CHUNK_8 } from './icons/icons-008.constant';
import { ICON_IMPORTS_CHUNK_9 } from './icons/icons-009.constant';
import { ICON_IMPORTS_CHUNK_10 } from './icons/icons-010.constant';
import { ICON_IMPORTS_CHUNK_11 } from './icons/icons-011.constant';
import { ICON_IMPORTS_CHUNK_12 } from './icons/icons-012.constant';

import type { ReiconModuleInterface } from '../interface/reicon-module.interface';
import type { ReiconIconNameEnum } from '@budgie/contracts';

export const ICON_IMPORTS: Record<ReiconIconNameEnum, () => Promise<ReiconModuleInterface>> = {
    ...ICON_IMPORTS_CHUNK_1,
    ...ICON_IMPORTS_CHUNK_2,
    ...ICON_IMPORTS_CHUNK_3,
    ...ICON_IMPORTS_CHUNK_4,
    ...ICON_IMPORTS_CHUNK_5,
    ...ICON_IMPORTS_CHUNK_6,
    ...ICON_IMPORTS_CHUNK_7,
    ...ICON_IMPORTS_CHUNK_8,
    ...ICON_IMPORTS_CHUNK_9,
    ...ICON_IMPORTS_CHUNK_10,
    ...ICON_IMPORTS_CHUNK_11,
    ...ICON_IMPORTS_CHUNK_12
};
