import { AccountWithInstrumentEntityInterface, CurrencyEnum } from '@budgie/contracts';

export interface GroupedVoiceTransactionInterface {
    readonly amount: number;
    readonly currency: CurrencyEnum | null;
    readonly account: AccountWithInstrumentEntityInterface | null;
    readonly comment: string;
    readonly aiContext: string;
}
