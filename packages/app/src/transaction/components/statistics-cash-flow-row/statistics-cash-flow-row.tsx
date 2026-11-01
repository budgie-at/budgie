import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { useProtectedWholeAmountLabel } from '../../../@generic/hook/use-protected-whole-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { getSignedPrefix } from '../../utils/get-signed-prefix.util';
import { StatisticsCashFlowStat } from '../statistics-cash-flow-stat/statistics-cash-flow-stat';

interface Props {
    readonly income: number;
    readonly expense: number;
}

const rowVariants = cva('-mx-3xl -mb-3xl border-t-hairline border-surface-separator', {
    variants: { isStacked: { true: 'flex-col', false: 'flex-row' } }
});

const dividerVariants = cva('bg-surface-separator', {
    variants: { isStacked: { true: 'ml-3xl h-hairline', false: 'my-lg w-hairline' } }
});

export const StatisticsCashFlowRow = ({ income, expense }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const isStacked = useIsAccessibilityTextSize();
    const isAmountProtected = useIsAmountProtected();
    const formatAmount = useProtectedWholeAmountLabel();

    const net = income - expense;
    const incomePrefix = isAmountProtected ? '' : getSignedPrefix(income);
    const netPrefix = isAmountProtected ? '' : getSignedPrefix(net);
    const incomeClassName = isPositiveNumber(income) && !isAmountProtected ? 'text-positive-foreground' : 'text-primary';
    const incomeLabel = `${incomePrefix}${formatAmount(income, defaultInstrument.symbol)}`;
    const netLabel = `${netPrefix}${formatAmount(Math.abs(net), defaultInstrument.symbol)}`;

    return (
        <View className={rowVariants({ isStacked })}>
            <StatisticsCashFlowStat label={t`Income`} value={incomeLabel} valueClassName={incomeClassName} />
            <View className={dividerVariants({ isStacked })} />
            <StatisticsCashFlowStat label={t`Net`} value={netLabel} valueClassName="text-primary" />
        </View>
    );
};
