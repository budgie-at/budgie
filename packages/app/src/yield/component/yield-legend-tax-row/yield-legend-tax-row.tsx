import { YieldGroupEnum } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { useIsIncreaseContrast } from '../../../@generic/hook/use-is-increase-contrast.hook';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { YIELD_GROUP_COLOR } from '../../constant/yield-group-color.constant';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

const ROW_CLASSNAME = 'min-h-[32px] flex-row items-center gap-x-[8px] px-sm';

interface Props {
    readonly total: number;
}

export const YieldLegendTaxRow = ({ total }: Props) => {
    const { t } = useLingui();
    const isIncreaseContrast = useIsIncreaseContrast();
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const isHidden = !isPositiveNumber(total);
    const label = t`Tax withheld`;
    const amount = `−${formatAmount(total, symbol)}`;
    const text = isHidden ? label : `${label} · ${amount}`;
    const rowClassName = cn(ROW_CLASSNAME, isHidden && 'opacity-0');
    const dotClassName = YIELD_GROUP_COLOR[YieldGroupEnum.TAX][isIncreaseContrast ? 'backgroundContrast' : 'background'];

    return (
        <View
            accessible={!isHidden}
            aria-hidden={isHidden}
            accessibilityLabel={t`${label}, ${amount}`}
            testID={PassiveIncomeSelector.LegendRow(YieldGroupEnum.TAX)}
            className={rowClassName}
        >
            <View className="w-[12px] items-center">
                <View className={cn('h-[10px] w-[10px] rounded-full', dotClassName)} />
            </View>
            <Text numberOfLines={1} className="text-sm tabular-nums text-secondary-foreground">
                {text}
            </Text>
        </View>
    );
};
