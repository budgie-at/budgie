import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { useHryvniaInstrumentQuery } from '../../query/use-hryvnia-instrument.query';
import { useInzhurFundReturnsQuery } from '../../query/use-inzhur-fund-returns.query';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurMoneyRow } from '../inzhur-money-row/inzhur-money-row';

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
            className="gap-y-md self-stretch rounded-3xl bg-surface-row px-3xl py-md"
            style={CONTINUOUS_CORNERS}
            testID={InzhurSelector.FundReturns}
        >
            <InzhurMoneyRow
                label={t`Reinvested dividends`}
                caption={t`Estimated from your statements`}
                amount={reinvested}
                instrumentSymbol={symbol}
            />
            {isPositiveNumber(bank) ? (
                <InzhurMoneyRow
                    label={t`Bank dividends`}
                    caption={t`From your bank transactions`}
                    amount={bank}
                    instrumentSymbol={symbol}
                />
            ) : null}
        </View>
    );
};
