import { AccountWithBankSyncEntityInterface } from '@budgie/contracts';

export interface CryptoCurrencyGroupInterface {
    readonly instrumentId: number;
    readonly instrumentCode: string;
    readonly instrumentName: string;
    readonly instrumentSymbol: string;
    readonly accounts: AccountWithBankSyncEntityInterface[];
}
