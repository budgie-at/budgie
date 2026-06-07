import type { AccountWithBankSyncEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';

export interface CryptoCurrencyGroupInterface {
    readonly instrument: InstrumentEntityInterface;
    readonly accounts: AccountWithBankSyncEntityInterface[];
}
