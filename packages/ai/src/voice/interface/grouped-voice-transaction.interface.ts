import { AccountWithInstrumentEntityInterface, CurrencyEnum } from '@budgie/contracts';

export interface GroupedVoiceTransactionInterface {
    amount: number;
    currency: CurrencyEnum | null;
    account: AccountWithInstrumentEntityInterface | null;
    comment: string;
    aiContext: string;
}
