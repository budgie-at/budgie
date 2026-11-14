import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { RETURN_ARROW_BY_DIRECTION } from '../../../brokerage/constant/return-arrow-by-direction.constant';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatGainPercent } from '../../../i18n/hook/use-format-gain-percent.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { calculateInstrumentReturn } from '../../utils/calculate-instrument-return.util';
import { getMarketMoveClassName } from '../../utils/get-market-move-class-name.util';
import { CurrencyMarketPageSelector } from '../currency-market-page/currency-market-page.selector';
import { CurrencyMarketPositionRow } from '../currency-market-position-row/currency-market-position-row';

import type { InstrumentPositionInterface } from '@budgie/market';

interface Props {
    readonly position: InstrumentPositionInterface;
    readonly valuationRate: number | null;
    readonly balance: number;
    readonly instrumentCode: string;
    readonly subtitle: string | null;
}

const PERCENT = 100;

export const CurrencyMarketReturnRow = ({ position, valuationRate, balance, instrumentCode, subtitle }: Props) => {
    const { t } = useLingui();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const formatMoney = useDisplayFormatDigits();
    const formatPercent = useFormatGainPercent();
    const isAmountProtected = useIsAmountProtected();

    const instrumentReturn = calculateInstrumentReturn(position, valuationRate, balance);
    const arrow = RETURN_ARROW_BY_DIRECTION[Math.sign(Math.round((instrumentReturn?.profit ?? 0) * PERCENT))];
    const returnParts = isDefined(instrumentReturn)
        ? [
              formatMoney(Math.abs(instrumentReturn.profit), symbol),
              isDefined(instrumentReturn.percent) ? formatPercent(instrumentReturn.percent / PERCENT) : null
          ].filter(isDefined)
        : [];
    const returnLabel = isNotEmptyArray(returnParts) ? `${arrow}${returnParts.join(' · ')}` : t`Unavailable`;
    const returnShare = isDefined(instrumentReturn?.percent) ? instrumentReturn.percent / PERCENT : (instrumentReturn?.profit ?? 0);
    const returnClassName =
        isDefined(instrumentReturn) && !isAmountProtected ? getMarketMoveClassName(returnShare) : 'text-secondary-foreground';

    return (
        <CurrencyMarketPositionRow
            label={t`Return`}
            value={returnLabel}
            valueClassName={returnClassName}
            testID={CurrencyMarketPageSelector.UnrealizedProfit(instrumentCode)}
            subtitle={subtitle}
        />
    );
};
