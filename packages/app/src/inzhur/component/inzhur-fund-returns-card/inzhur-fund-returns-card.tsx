import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
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
    const { dividendTotals, latestPrice } = useInzhurFundReturnsQuery(account.id, account.instrumentId);
    const symbol = useHryvniaInstrumentQuery()?.symbol ?? '';
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();
    const formatAmount = useFormatDigits(2);

    const reinvested = convertFromMicroUnits(dividendTotals?.reinvested ?? 0);
    const bank = convertFromMicroUnits(dividendTotals?.bank ?? 0);
    const priceDate = isDefined(latestPrice) ? formatMonthAndDayAndOptionalYear(latestPrice.priceDate) : '';

    return (
        <View className="self-stretch rounded-3xl bg-surface-row py-md" style={CONTINUOUS_CORNERS} testID={InzhurSelector.FundReturns}>
            <InzhurFundReturnRow label={t`Reinvested dividends`} value={formatAmount(reinvested, symbol)} />
            {isPositiveNumber(bank) ? <InzhurFundReturnRow label={t`Bank dividends`} value={formatAmount(bank, symbol)} /> : null}
            {isDefined(latestPrice) ? (
                <InzhurFundReturnRow
                    label={t`Price per certificate`}
                    caption={t`As of ${priceDate}`}
                    value={formatAmount(latestPrice.price, symbol)}
                />
            ) : null}
        </View>
    );
};
