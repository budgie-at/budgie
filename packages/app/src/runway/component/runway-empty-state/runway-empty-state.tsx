import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { RUNWAY_MINIMUM_MONTHS } from '../../constant/runway-minimum-months.constant';
import { RunwayCard } from '../runway-card/runway-card';

interface Props {
    readonly monthsUsed: number;
}

const stepVariants = cva('h-[4px] flex-1 rounded-full', {
    variants: { isDone: { true: 'bg-primary', false: 'bg-primary/10' } }
});

const MONTH_STEPS = Array.from({ length: RUNWAY_MINIMUM_MONTHS }, (_, index) => index);

export const RunwayEmptyState = ({ monthsUsed }: Props) => {
    const { t } = useLingui();

    const progressLabel = t`${monthsUsed} of ${RUNWAY_MINIMUM_MONTHS} complete months`;
    const hasHistory = isPositiveNumber(monthsUsed);
    const title = hasHistory ? t`Not enough history yet` : t`Add transactions to see your runway`;
    const description = hasHistory
        ? t`Runway needs 3 complete months of transactions to forecast your balance.`
        : t`Once you have 3 months of transactions, Runway shows how long your balance lasts.`;

    return (
        <RunwayCard className="items-center gap-y-xl px-3xl py-7xl">
            <CircleIcon icon={UserIconNameEnum.CalendarClock} size={56} iconSize={26} radius={28} border={false} variant="ghost" />

            <View className="items-center gap-y-sm">
                <Text className="text-center text-lg font-semibold text-primary">{title}</Text>
                <Text className="text-center text-sm text-secondary-foreground">{description}</Text>
            </View>

            {hasHistory ? (
                <View accessible accessibilityLabel={progressLabel} className="w-full max-w-[200px] gap-y-sm">
                    <View className="flex-row gap-x-xs">
                        {MONTH_STEPS.map(step => (
                            <View key={step} className={stepVariants({ isDone: step < monthsUsed })} />
                        ))}
                    </View>
                    <Text className="text-center text-xs tabular-nums text-secondary-foreground">{progressLabel}</Text>
                </View>
            ) : null}
        </RunwayCard>
    );
};
