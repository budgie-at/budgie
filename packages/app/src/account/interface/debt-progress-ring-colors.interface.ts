import type { AccountDebtTypeEnum } from '@budgie/contracts';

export interface DebtProgressRingColorsInterface {
    readonly track: string;
    readonly fill: Readonly<Record<AccountDebtTypeEnum, string>>;
}
