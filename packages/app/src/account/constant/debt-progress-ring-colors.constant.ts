import { AccountDebtTypeEnum } from '@budgie/contracts';

import { ColorSchemaEnum } from '../../theme/enum/color-schema.enum';

import type { DebtProgressRingColorsInterface } from '../interface/debt-progress-ring-colors.interface';

export const DEBT_PROGRESS_RING_COLORS: Record<ColorSchemaEnum, DebtProgressRingColorsInterface> = {
    [ColorSchemaEnum.Light]: {
        track: 'rgba(229, 229, 229, 1)',
        fill: {
            [AccountDebtTypeEnum.BORROW]: 'rgba(239, 68, 68, 1)',
            [AccountDebtTypeEnum.LENT]: 'rgba(16, 185, 129, 1)'
        }
    },
    [ColorSchemaEnum.Dark]: {
        track: 'rgba(34, 34, 34, 1)',
        fill: {
            [AccountDebtTypeEnum.BORROW]: 'rgba(255, 68, 68, 1)',
            [AccountDebtTypeEnum.LENT]: 'rgba(0, 255, 136, 1)'
        }
    }
};
