import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
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
    const { dividendTotals, firstEntryAt } = useInzhurFundReturnsQuery(account.id, account.instrumentId);
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();
    const symbol = useHryvniaInstrumentQuery()?.symbol ?? '';

    const reinvested = convertFromMicroUnits(dividendTotals?.reinvested ?? 0);
    const bank = convertFromMicroUnits(dividendTotals?.bank ?? 0);
    const sinceDate = isDefined(firstEntryAt) ? formatMonthAndDayAndOptionalYear(firstEntryAt) : null;
    const reinvestedCaption = isDefined(sinceDate) ? t`Reinvested since ${sinceDate}` : t`Reinvested`;

    return (
        <View
            className="gap-y-md self-stretch rounded-3xl bg-surface-row px-3xl py-md"
            style={CONTINUOUS_CORNERS}
            testID={InzhurSelector.FundReturns}
        >
            <InzhurMoneyRow
                label={t`Estimated dividends to date`}
                caption={reinvestedCaption}
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
