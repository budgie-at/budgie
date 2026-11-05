import type { EnableBankingAuthorizationResultInterface } from '@budgie/sync';

export interface EnableBankingAuthorizationInterface extends EnableBankingAuthorizationResultInterface {
    readonly bankName: string;
}
