import type { BankProviderEnum } from '../enum/bank-provider.enum';

export interface BankClientInfoInterface {
    readonly id: string;
    readonly name: string;
    readonly provider: BankProviderEnum;
    readonly webHookUrl?: string;
    readonly permissions?: string;
}
