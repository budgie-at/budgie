import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { useHryvniaInstrumentQuery } from '../../query/use-hryvnia-instrument.query';
import { useInzhurFundReturnsQuery } from '../../query/use-inzhur-fund-returns.query';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurFundReturnRow } from '../inzhur-fund-return-row/inzhur-fund-return-row';

import type { AccountEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'id' | 'instrumentId'>;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const InzhurFundReturnsCard = ({ account }: Props) => {
    const { t } = useLingui();
    const { dividendTotals } = useInzhurFundReturnsQuery(account.id, account.instrumentId);
    const symbol = useHryvniaInstrumentQuery()?.symbol ?? '';

    const reinvested = convertFromMicroUnits(dividendTotals?.reinvested ?? 0);
    const bank = convertFromMicroUnits(dividendTotals?.bank ?? 0);

    return (
        <View
            className="gap-y-md self-stretch rounded-3xl bg-surface-row p-3xl"
            style={CONTINUOUS_CORNERS}
            testID={InzhurSelector.FundReturns}
        >
            <InzhurFundReturnRow label={t`Reinvested dividends · all time`} amount={reinvested} instrumentSymbol={symbol} />
            {isPositiveNumber(bank) ? (
                <InzhurFundReturnRow label={t`Bank dividends · all time`} amount={bank} instrumentSymbol={symbol} />
            ) : null}
        </View>
    );
};
