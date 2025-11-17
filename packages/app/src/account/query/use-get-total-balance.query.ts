import { ExchangeRateEntityInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { accountRepository, exchangeRateRepository } from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { useSettingsContext } from '../../settings/context/settings.context';

export const useGetTotalBalanceQuery = () => {
    const { defaultInstrument } = useSettingsContext();
    const { data: accounts } = useLiveQuery(accountRepository.getAll());

    const quoteInstrumentIds = new Set(accounts.map(account => account.instrumentId));

    const { data: exchangeRates } = useLiveQuery(
        exchangeRateRepository.findByBaseAndQuoteIds(defaultInstrument.id, [...quoteInstrumentIds]),
        [defaultInstrument.id, [...quoteInstrumentIds]]
    );

    const ratesByQuoteInstrument = exchangeRates.reduce<Record<number, ExchangeRateEntityInterface>>(
        (acc, rate) => ({ ...acc, [rate.quoteInstrumentId]: rate }),
        {}
    );

    return accounts.reduce((acc, account) => {
        if (!account.includeInNetWorth) {
            return acc;
        }

        if (account.instrumentId === defaultInstrument.id) {
            return acc + account.currentBalance;
        }

        const rate = ratesByQuoteInstrument[account.instrument.id];

        if (!isDefined(rate)) {
            return acc + account.currentBalance;
        }

        return acc + convertToMicroUnits(convertFromMicroUnits(account.currentBalance) / convertFromMicroUnits(rate.rate));
    }, 0);
};
