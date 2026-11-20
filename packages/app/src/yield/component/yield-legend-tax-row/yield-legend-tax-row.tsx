import { YieldGroupEnum } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldLegendEntry } from '../yield-legend-entry/yield-legend-entry';

const ROW_CLASSNAME = 'min-h-[44px] w-full flex-row items-center gap-x-[8px] px-sm py-xs';
const AMOUNT_CLASSNAME = 'text-right text-sm tabular-nums text-secondary-foreground';
const EMPTY_AMOUNT = '—';

interface Props {
    readonly total: number;
}

export const YieldLegendTaxRow = ({ total }: Props) => {
    const { t } = useLingui();
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const isEmpty = !isPositiveNumber(total);
    const label = t`Tax withheld`;
    const amount = isEmpty ? EMPTY_AMOUNT : `−${formatAmount(total, symbol)}`;
    const rowClassName = cn(ROW_CLASSNAME, isEmpty && 'opacity-40');

    return (
        <View
            accessible
            accessibilityLabel={t`${label}, ${amount}`}
            testID={PassiveIncomeSelector.LegendRow(YieldGroupEnum.TAX)}
            className={rowClassName}
        >
            <YieldLegendEntry group={YieldGroupEnum.TAX} label={label} amount={amount} amountClassName={AMOUNT_CLASSNAME} isMuted={false} />
        </View>
    );
};
