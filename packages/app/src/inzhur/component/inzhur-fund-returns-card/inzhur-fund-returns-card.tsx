import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { DepositDetailsRow } from '../../../account/component/deposit-details-row/deposit-details-row';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useHryvniaInstrumentQuery } from '../../query/use-hryvnia-instrument.query';
import { useInzhurFundReturnsQuery } from '../../query/use-inzhur-fund-returns.query';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurFundReturnMoneyRow } from '../inzhur-fund-return-money-row/inzhur-fund-return-money-row';

import type { AccountEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'id' | 'instrumentId'>;
}

export const InzhurFundReturnsCard = ({ account }: Props) => {
    const { t } = useLingui();
    const { dividendTotals, latestPrice } = useInzhurFundReturnsQuery(account.id, account.instrumentId);
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const hryvnia = useHryvniaInstrumentQuery();
    const { formatDayAndMonthAndYear } = useFormatDate();
    const formatPrice = useFormatDigits(2);

    const priceDate = isDefined(latestPrice) ? formatDayAndMonthAndYear(latestPrice.priceDate) : '';
    const priceRow = isDefined(latestPrice) ? (
        <DepositDetailsRow label={t`Price as of ${priceDate}`} value={formatPrice(latestPrice.price, hryvnia?.symbol ?? '')} />
    ) : null;

    return (
        <View
            className="gap-y-lg rounded-3xl border border-secondary-corner bg-secondary-background/40 p-5xl"
            testID={InzhurSelector.FundReturns}
        >
            <InzhurFundReturnMoneyRow
                label={t`Bank dividends`}
                microUnits={dividendTotals?.bank ?? 0}
                instrumentSymbol={defaultInstrument.symbol}
            />
            <InzhurFundReturnMoneyRow
                label={t`Reinvested dividends`}
                microUnits={dividendTotals?.reinvested ?? 0}
                instrumentSymbol={defaultInstrument.symbol}
            />
            {priceRow}
        </View>
    );
};
