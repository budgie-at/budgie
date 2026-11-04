import { InstrumentTypeEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';

import { isDefined } from '@rnw-community/shared';

import { useUnitValuationRateQuery } from '../../exchange-rate/query/use-unit-valuation-rate.query';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';

import type { AccountHeroValueInterface } from '../interface/account-hero-value.interface';

export const useAccountHeroValue = (account: AccountHeroValueInterface['account'], balance: number): AccountHeroValueInterface => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const valuationRate = useUnitValuationRateQuery(account.instrument.id, defaultInstrument.id);

    if (account.instrument.type !== InstrumentTypeEnum.FUND || !isDefined(valuationRate)) {
        return { balance, account };
    }

    return { balance: balance * valuationRate, account: { type: account.type, instrument: defaultInstrument } };
};
