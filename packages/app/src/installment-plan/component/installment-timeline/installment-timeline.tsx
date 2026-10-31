import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { addMonths } from 'date-fns';
import { Text, View } from 'react-native';

import { ConvertToInstallmentModalSelector } from '../../../app/convert-to-installment-modal.selector';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { InstallmentTimelinePoint } from '../installment-timeline-point/installment-timeline-point';

interface Props {
    readonly operatedAt: Date;
    readonly installmentCount: number;
}

const MONTHLY_POINTS_LIMIT = 6;

export const InstallmentTimeline = ({ operatedAt, installmentCount }: Props) => {
    const { t } = useLingui();
    const { formatShortMonth, formatMonthAndYear, formatDayAndMonthAndYear } = useFormatDate();

    const isMonthly = installmentCount <= MONTHLY_POINTS_LIMIT;
    const lastOffset = installmentCount - 1;
    const isYearCrossed = addMonths(operatedAt, lastOffset).getFullYear() !== operatedAt.getFullYear();
    const points = (isMonthly ? Array.from({ length: installmentCount }, (_, offset) => offset) : [0, lastOffset]).map(offset => {
        const formatPoint = isYearCrossed && (offset === 0 || offset === lastOffset) ? formatMonthAndYear : formatShortMonth;

        return {
            key: offset === lastOffset ? 'end' : String(offset),
            label: formatPoint(addMonths(operatedAt, offset)),
            isPaid: offset === 0
        };
    });
    const nextPaymentLabel = formatDayAndMonthAndYear(addMonths(operatedAt, 1));
    const finalPaymentLabel = formatDayAndMonthAndYear(addMonths(operatedAt, lastOffset));
    const accessibilityLabel = t({
        message: plural(installmentCount, {
            one: `# monthly payment until ${finalPaymentLabel}, the first one is already paid, next on ${nextPaymentLabel}`,
            other: `# monthly payments until ${finalPaymentLabel}, the first one is already paid, next on ${nextPaymentLabel}`
        })
    });

    return (
        <View className="gap-y-md" accessible accessibilityLabel={accessibilityLabel} testID={ConvertToInstallmentModalSelector.Timeline}>
            <View className="flex-row justify-between" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <View className="absolute inset-x-1/12 top-[4px] h-0.5 rounded-full bg-secondary-corner" />
                {points.map(point => (
                    <InstallmentTimelinePoint key={point.key} label={point.label} isPaid={point.isPaid} />
                ))}
            </View>
            <Text className="text-center text-sm text-secondary-foreground tabular-nums">
                <Trans>Next payment {nextPaymentLabel}</Trans>
            </Text>
        </View>
    );
};
