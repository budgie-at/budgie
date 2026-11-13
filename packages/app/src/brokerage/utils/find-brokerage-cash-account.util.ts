import { InstrumentTypeEnum } from '@budgie/contracts';

import type { AccountWithInstrumentEntityInterface } from '@budgie/contracts';

export const findBrokerageCashAccount = (
    accounts: readonly AccountWithInstrumentEntityInterface[],
    quoteInstrumentId: number | null
): AccountWithInstrumentEntityInterface | undefined => {
    const cashAccounts = accounts.filter(account => account.instrument.type === InstrumentTypeEnum.FIAT);

    return cashAccounts.find(account => account.instrumentId === quoteInstrumentId) ?? cashAccounts.at(0);
};
