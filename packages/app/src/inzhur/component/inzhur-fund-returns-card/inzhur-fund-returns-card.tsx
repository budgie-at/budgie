import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
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
    const formatAmount = useFormatDigits(2);

    const reinvested = convertFromMicroUnits(dividendTotals?.reinvested ?? 0);
    const bank = convertFromMicroUnits(dividendTotals?.bank ?? 0);

    return (
        <View className="self-stretch rounded-3xl bg-surface-row py-md" style={CONTINUOUS_CORNERS} testID={InzhurSelector.FundReturns}>
            <InzhurFundReturnRow label={t`Reinvested dividends · all time`} value={formatAmount(reinvested, symbol)} />
            {isPositiveNumber(bank) ? (
                <InzhurFundReturnRow label={t`Bank dividends · all time`} value={formatAmount(bank, symbol)} />
            ) : null}
        </View>
    );
};
