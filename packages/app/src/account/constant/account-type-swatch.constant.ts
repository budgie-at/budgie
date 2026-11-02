import { AccountTypeEnum } from '@budgie/contracts';

import type { ChartSwatchInterface } from '../../@generic/interface/chart-swatch.interface';

const BANK_SWATCH: ChartSwatchInterface = { fill: 'bg-chart-1', soft: 'bg-chart-1/20', text: 'text-chart-1' };
const CRYPTO_SWATCH: ChartSwatchInterface = { fill: 'bg-chart-4', soft: 'bg-chart-4/20', text: 'text-chart-4' };

export const ACCOUNT_TYPE_SWATCH: Record<AccountTypeEnum, ChartSwatchInterface> = {
    [AccountTypeEnum.BANK]: BANK_SWATCH,
    [AccountTypeEnum.BANK_SYNC]: BANK_SWATCH,
    [AccountTypeEnum.CASH]: { fill: 'bg-chart-3', soft: 'bg-chart-3/20', text: 'text-chart-3' },
    [AccountTypeEnum.SAVINGS]: { fill: 'bg-chart-6', soft: 'bg-chart-6/20', text: 'text-chart-6' },
    [AccountTypeEnum.DEPOSIT]: { fill: 'bg-chart-5', soft: 'bg-chart-5/20', text: 'text-chart-5' },
    [AccountTypeEnum.CRYPTO]: CRYPTO_SWATCH,
    [AccountTypeEnum.CRYPTO_SYNC]: CRYPTO_SWATCH,
    [AccountTypeEnum.STOCKS]: { fill: 'bg-chart-2', soft: 'bg-chart-2/20', text: 'text-chart-2' },
    [AccountTypeEnum.DEBT]: { fill: 'bg-secondary-foreground', soft: 'bg-surface-disc', text: 'text-secondary-foreground' }
};
