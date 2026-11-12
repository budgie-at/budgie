import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyArray } from '@rnw-community/shared';

import { GainLine } from '../../../@generic/component/gain-line/gain-line';
import { isListedSecurityType } from '../../../instrument/utils/is-listed-security-type.util';
import { useInstrumentPositionsQuery } from '../../../market-data/query/use-instrument-positions.query';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { BrokerageSelector } from '../../selector/brokerage.selector';

import type { HomeAccountBalanceInterface } from '../../../account/interface/home-account-balance.interface';
import type { InstitutionGroupInterface } from '../../../account/interface/institution-group.interface';

interface Props {
    readonly institution: Pick<InstitutionGroupInterface, 'accounts'>;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
}

export const BrokerageGainLine = ({ institution, balancesByAccountId }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const securities = institution.accounts.filter(account => isListedSecurityType(account.instrument.type));
    const positions = useInstrumentPositionsQuery(
        securities.map(account => account.instrumentId),
        defaultInstrument.id
    );

    const balances = securities.map(account => balancesByAccountId.get(account.id));

    if (!isNotEmptyArray(positions) || balances.some(balance => balance?.isValued !== true)) {
        return null;
    }

    const value = balances.reduce((total, balance) => total + (balance?.convertedBalance ?? 0), 0);
    const gain = positions.reduce((total, position) => total + position.realizedProfitLoss - (position.costBasis ?? 0), value);

    return (
        <GainLine
            gain={gain}
            percent={null}
            suffix={t`total return`}
            instrumentSymbol={defaultInstrument.symbol}
            testID={BrokerageSelector.GainLine}
        />
    );
};
