import type { MonobankAccountTypeEnum } from '../enum/monobank-account-type.enum';
import type { MonobankCashbackTypeEnum } from '../enum/monobank-cashback-type.enum';

export interface MonobankAccountApiInterface {
    readonly id: string;
    readonly sendId: string;
    readonly currencyCode: number;
    readonly cashbackType: MonobankCashbackTypeEnum;
    readonly balance: number;
    readonly creditLimit: number;
    readonly maskedPan: string[];
    readonly type: MonobankAccountTypeEnum;
    readonly iban: string;
}
