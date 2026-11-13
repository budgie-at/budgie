import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { getMarketChangeSign } from '../../utils/get-market-change-sign.util';
import { getMarketMoveClassName } from '../../utils/get-market-move-class-name.util';
import { CurrencyMarketPageSelector } from '../currency-market-page/currency-market-page.selector';
import { CurrencyMarketPositionRow } from '../currency-market-position-row/currency-market-position-row';

interface Props {
    readonly realizedProfitLoss: number;
    readonly instrumentCode: string;
}

export const CurrencyMarketRealizedReturnRow = ({ realizedProfitLoss, instrumentCode }: Props) => {
    const { t } = useLingui();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const formatMoney = useDisplayFormatDigits();

    return (
        <CurrencyMarketPositionRow
            label={t`Realized return`}
            value={`${getMarketChangeSign(realizedProfitLoss)}${formatMoney(Math.abs(realizedProfitLoss), symbol)}`}
            valueClassName={getMarketMoveClassName(realizedProfitLoss)}
            testID={CurrencyMarketPageSelector.RealizedProfit(instrumentCode)}
        />
    );
};
