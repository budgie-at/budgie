import { AccountWithInstrumentEntityInterface, CurrencyEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

export const findAccountByCurrency = (
    accounts: AccountWithInstrumentEntityInterface[],
    currency: CurrencyEnum | null
): AccountWithInstrumentEntityInterface | null => {
    if (!isDefined(currency)) {
        return null;
    }

    const currencyCode: string = currency;

    return accounts.find(account => account.instrument.code === currencyCode) ?? null;
};
