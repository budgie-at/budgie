import { useLingui } from '@lingui/react/macro';
import { addMonths } from 'date-fns';
import { useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { ConvertToInstallmentModalSelector } from '../../../app/convert-to-installment-modal.selector';
import { useI18nContext } from '../../../i18n/context/i18n.context';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { InstallmentTimelinePoint } from '../installment-timeline-point/installment-timeline-point';

import type { ConvertToInstallmentFormValues } from '../../constant/convert-to-installment-form-schema.constant';

interface Props {
    readonly operatedAt: Date;
}

const MONTH_LABELS_LIMIT = 6;
const HALF_PERCENT = 50;

export const InstallmentTimeline = ({ operatedAt }: Props) => {
    const { t } = useLingui();
    const { intl } = useI18nContext();
    const { formatMonthAndYear } = useFormatDate();
    const { control } = useFormContext<ConvertToInstallmentFormValues>();
    const installmentCount = useWatch({ control, name: 'installmentCount' });

    const paymentDates = Array.from({ length: installmentCount }, (_, index) => addMonths(operatedAt, index));
    const firstPaymentLabel = formatMonthAndYear(operatedAt);
    const lastPaymentLabel = formatMonthAndYear(addMonths(operatedAt, installmentCount - 1));
    const trackInset = `${HALF_PERCENT / installmentCount}%` as const;
    const trackStyle = { left: trackInset, right: trackInset };
    const hasMonthLabels = installmentCount <= MONTH_LABELS_LIMIT;

    return (
        <View
            className="gap-y-sm"
            accessible
            accessibilityLabel={t`Payments from ${firstPaymentLabel} to ${lastPaymentLabel}`}
            testID={ConvertToInstallmentModalSelector.Timeline}
        >
            <View className="h-2 flex-row">
                <View className="absolute top-[3px] h-px bg-secondary-corner" style={trackStyle} />
                {paymentDates.map((paymentDate, index) => (
                    <InstallmentTimelinePoint key={paymentDate.getTime()} isPaid={index === 0} />
                ))}
            </View>
            {hasMonthLabels ? (
                <View className="flex-row">
                    {paymentDates.map(paymentDate => (
                        <Text
                            key={paymentDate.getTime()}
                            className="flex-1 text-center text-xs text-secondary-foreground"
                            numberOfLines={1}
                        >
                            {intl.formatDate(paymentDate, { month: 'short' })}
                        </Text>
                    ))}
                </View>
            ) : (
                <View className="flex-row justify-between">
                    <Text className="text-xs text-secondary-foreground">{firstPaymentLabel}</Text>
                    <Text className="text-xs text-secondary-foreground">{lastPaymentLabel}</Text>
                </View>
            )}
        </View>
    );
};
