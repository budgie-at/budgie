import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useInstallmentPlanScheduleQuery } from '../../query/use-installment-plan-schedule.query';

interface Props {
    readonly accountId: number;
    readonly instrumentSymbol: string;
}

export const InstallmentPlanNextPayment = ({ accountId, instrumentSymbol }: Props) => {
    const { t } = useLingui();
    const protectAmount = useProtectedAmountLabel();
    const { formatMonthAndDay } = useFormatDate();
    const schedule = useInstallmentPlanScheduleQuery(accountId);

    if (!isDefined(schedule?.nextAmount) || !isDefined(schedule.nextDueAt)) {
        return null;
    }

    const formattedNextAmount = protectAmount(convertFromMicroUnits(schedule.nextAmount), instrumentSymbol);
    const nextDate = formatMonthAndDay(schedule.nextDueAt);

    return (
        <View className="shrink flex-row items-center gap-x-xs">
            <Text className="text-xs text-secondary-foreground">·</Text>
            <Text className="shrink text-xs text-secondary-foreground tabular-nums" numberOfLines={1}>
                {t`Next ${formattedNextAmount} · ${nextDate}`}
            </Text>
        </View>
    );
};
