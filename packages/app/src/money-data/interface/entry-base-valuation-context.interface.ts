import type { AccountEntityInterface, DB, InstrumentEntityInterface } from '@budgie/contracts';

export interface EntryBaseValuationContextInterface {
    readonly baseInstrument: InstrumentEntityInterface | undefined;
    readonly accounts: Map<number, Promise<Pick<AccountEntityInterface, 'instrumentId' | 'type'> | undefined>>;
    readonly rates: Map<string, Promise<number | null>>;
    readonly tx?: DB;
}
