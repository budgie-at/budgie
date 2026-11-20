import { YieldGroupEnum } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { useIsIncreaseContrast } from '../../../@generic/hook/use-is-increase-contrast.hook';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { YIELD_GROUP_COLOR } from '../../constant/yield-group-color.constant';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldLegendEntry } from '../yield-legend-entry/yield-legend-entry';

const AMOUNT_CLASSNAME = 'text-sm font-semibold tabular-nums text-secondary-foreground';
const ROW_CLASSNAME = 'min-h-[44px] flex-row items-center gap-x-sm py-xs';
const FULL_WIDTH_CLASSNAME = 'w-full';
const HALF_WIDTH_CLASSNAME = 'w-1/2';

interface Props {
    readonly total: number;
    readonly isFullWidth: boolean;
}

export const YieldLegendTaxRow = ({ total, isFullWidth }: Props) => {
    const { t } = useLingui();
    const isIncreaseContrast = useIsIncreaseContrast();
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const label = t`Tax withheld`;
    const amount = `−${formatAmount(total, symbol)}`;
    const dotClassName = YIELD_GROUP_COLOR[YieldGroupEnum.TAX][isIncreaseContrast ? 'backgroundContrast' : 'background'];

    const rowClassName = cn(ROW_CLASSNAME, isFullWidth ? FULL_WIDTH_CLASSNAME : HALF_WIDTH_CLASSNAME);

    return (
        <View
            accessible
            accessibilityLabel={t`${label}, ${amount}`}
            testID={PassiveIncomeSelector.LegendRow(YieldGroupEnum.TAX)}
            className={rowClassName}
        >
            <YieldLegendEntry dotClassName={dotClassName} label={label} amount={amount} amountClassName={AMOUNT_CLASSNAME} />
        </View>
    );
};
