import type { AccountWithSyncEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';

export interface CryptoCurrencyGroupInterface {
    readonly instrument: InstrumentEntityInterface;
    readonly accounts: AccountWithSyncEntityInterface[];
}
