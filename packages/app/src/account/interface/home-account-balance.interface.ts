import { AccountDebtTypeEnum, AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';

export interface HomeAccountBalanceInterface {
    readonly accountId: number;
    readonly accountType: AccountTypeEnum;
    readonly balance: number;
    readonly bankProvider: ExternalSourceEnum | null;
    readonly convertedBalance: number;
    readonly debtType: AccountDebtTypeEnum;
    readonly includeInNetWorth: boolean;
    readonly isActive: boolean;
}
