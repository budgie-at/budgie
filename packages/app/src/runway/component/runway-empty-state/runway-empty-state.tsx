import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';
import { RUNWAY_MINIMUM_MONTHS } from '../../constant/runway-minimum-months.constant';
import { RunwayCard } from '../runway-card/runway-card';

interface Props {
    readonly monthsUsed: number;
}

const stepVariants = cva('h-[4px] flex-1 rounded-full', {
    variants: { isDone: { true: 'bg-primary', false: 'bg-surface-fill' } }
});

const MONTH_STEPS = Array.from({ length: RUNWAY_MINIMUM_MONTHS }, (_, index) => index);

export const RunwayEmptyState = ({ monthsUsed }: Props) => {
    const { t } = useLingui();

    const progressLabel = t`${monthsUsed} of ${RUNWAY_MINIMUM_MONTHS} months`;

    return (
        <RunwayCard className="items-center gap-y-xl px-3xl py-7xl">
            <CircleIcon icon={UserIconNameEnum.CalendarClock} size={56} iconSize={26} radius={28} border={false} variant="ghost" />

            <View className="items-center gap-y-sm">
                <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className="text-center text-lg font-semibold text-primary">
                    <Trans>Not enough history yet</Trans>
                </Text>
                <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className="text-center text-sm text-secondary-foreground">
                    <Trans>Runway needs 3 complete months of transactions to forecast your balance.</Trans>
                </Text>
            </View>

            <View accessible accessibilityLabel={progressLabel} className="w-full max-w-[200px] gap-y-sm">
                <View className="flex-row gap-x-xs">
                    {MONTH_STEPS.map(step => (
                        <View key={step} className={stepVariants({ isDone: step < monthsUsed })} />
                    ))}
                </View>
                <Text
                    maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                    className="text-center text-xs tabular-nums text-secondary-foreground"
                >
                    {progressLabel}
                </Text>
            </View>
        </RunwayCard>
    );
};
