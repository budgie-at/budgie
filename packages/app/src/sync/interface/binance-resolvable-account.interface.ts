import type { BankAccountInterface } from '@budgie/bank-sync';

export interface BinanceResolvableAccountInterface {
    readonly bankAccount: BankAccountInterface;
    readonly instrumentId: number;
}
