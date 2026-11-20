import { YieldGroupEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { useYieldLegendAmounts } from '../../hook/use-yield-legend-amounts.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldLegendEntry } from '../yield-legend-entry/yield-legend-entry';

const ROW_CLASSNAME = 'min-h-[40px] w-full flex-row items-center gap-x-[8px] px-sm py-xs';
const AMOUNT_CLASSNAME = 'text-right text-sm tabular-nums text-secondary-foreground';
const EMPTY_AMOUNT = '—';

interface Props {
    readonly total: number;
    readonly isCompact: boolean;
}

export const YieldLegendTaxRow = ({ total, isCompact }: Props) => {
    const { t } = useLingui();
    const amounts = useYieldLegendAmounts(total, 0, isCompact);

    const isEmpty = !isPositiveNumber(total);
    const label = t`Tax withheld`;
    const amount = isEmpty ? EMPTY_AMOUNT : `−${amounts.amount}`;
    const exactAmount = isEmpty ? EMPTY_AMOUNT : `−${amounts.exact}`;

    return (
        <View
            accessible
            accessibilityLabel={t`${label}, ${exactAmount}`}
            testID={PassiveIncomeSelector.LegendRow(YieldGroupEnum.TAX)}
            className={ROW_CLASSNAME}
        >
            <YieldLegendEntry
                group={YieldGroupEnum.TAX}
                label={label}
                amount={amount}
                amountClassName={AMOUNT_CLASSNAME}
                isEmpty={isEmpty}
            />
        </View>
    );
};
