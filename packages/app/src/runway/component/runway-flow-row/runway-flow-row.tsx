import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Fragment } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { useRunwayAmountLabel } from '../../hook/use-runway-amount-label.hook';
import { RunwaySelector } from '../../runway.selector';
import { RunwayFlowStat } from '../runway-flow-stat/runway-flow-stat';
import { RunwaySection } from '../runway-section/runway-section';

import type { RunwayComputationInterface } from '../../interface/runway-computation.interface';

interface Props {
    readonly computation: RunwayComputationInterface;
}

const containerVariants = cva('', {
    variants: { isStacked: { true: 'flex-col', false: 'flex-row' } }
});

const separatorVariants = cva('bg-surface-separator', {
    variants: { isStacked: { true: 'ml-3xl h-hairline', false: 'my-xl w-hairline' } }
});

const ACCESSIBILITY_FONT_SCALE = 1.6;
const NEUTRAL_NET_THRESHOLD = 1_000_000;

export const RunwayFlowRow = ({ computation }: Props) => {
    const { t } = useLingui();
    const formatAmount = useRunwayAmountLabel();
    const isStacked = useWindowDimensions().fontScale >= ACCESSIBILITY_FONT_SCALE;

    const { burn, income, net } = computation;
    const negativeOrNeutralVariant = Math.abs(net) <= NEUTRAL_NET_THRESHOLD ? 'warning' : 'destructive';
    const netVariant = net > NEUTRAL_NET_THRESHOLD ? 'positive' : negativeOrNeutralVariant;
    const netSign = net > NEUTRAL_NET_THRESHOLD ? '+' : '';

    const stats = [
        { label: t`Expenses`, value: formatAmount(burn), variant: 'primary' },
        { label: t`Income`, value: formatAmount(income), variant: 'primary' },
        { label: t`Net`, value: `${netSign}${formatAmount(net)}`, variant: netVariant }
    ] as const;

    return (
        <RunwaySection title={t`Typical month`} testID={RunwaySelector.FlowRow}>
            <View className={containerVariants({ isStacked })}>
                {stats.map((stat, index) => (
                    <Fragment key={stat.label}>
                        {index > 0 ? <View className={separatorVariants({ isStacked })} /> : null}
                        <RunwayFlowStat label={stat.label} value={stat.value} variant={stat.variant} />
                    </Fragment>
                ))}
            </View>
        </RunwaySection>
    );
};
