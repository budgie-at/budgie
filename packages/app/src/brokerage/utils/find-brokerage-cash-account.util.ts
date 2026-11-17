import { isBrokerageCashAccount } from './is-brokerage-cash-account.util';

import type { AccountWithInstrumentEntityInterface } from '@budgie/contracts';

export const findBrokerageCashAccount = (
    accounts: readonly AccountWithInstrumentEntityInterface[],
    quoteInstrumentId: number | null
): AccountWithInstrumentEntityInterface | undefined => {
    const cashAccounts = accounts.filter(isBrokerageCashAccount);

    return cashAccounts.find(account => account.instrumentId === quoteInstrumentId) ?? cashAccounts.at(0);
};
