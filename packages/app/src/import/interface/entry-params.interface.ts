import { AccountEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';

export interface EntryParamsInterface {
    account: AccountEntityInterface;
    amount: number;
    instrument: InstrumentEntityInterface;
}
