import { BudgetCommittedSourceKindEnum } from '@budgie/budget';
import { convertFromMicroUnits } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

import type { BudgetUpcomingChargeInterface } from '@budgie/budget';
import type { MessageDescriptor } from '@lingui/core';

interface Props {
    readonly charge: BudgetUpcomingChargeInterface;
    readonly currencySymbol: string;
}

const SOURCE_LABEL: Record<BudgetCommittedSourceKindEnum, MessageDescriptor> = {
    [BudgetCommittedSourceKindEnum.RECURRING]: msg`Recurring`,
    [BudgetCommittedSourceKindEnum.INSTALLMENT]: msg`Installment`
};

export const BudgetUpcomingChargeRow = ({ charge, currencySymbol }: Props) => {
    const { t } = useLingui();
    const formatProtectedAmount = useProtectedAmountLabel();
    const { formatMonthAndDay } = useFormatDate();
    const dateLabel = formatMonthAndDay(charge.date);
    const kindLabel = t(SOURCE_LABEL[charge.source.kind]);

    const handlePress = () => {
        router.push({ pathname: '/account/[id]/details', params: { id: String(charge.source.id) } });
    };

    return (
        <HapticPressable
            disabled={charge.source.kind !== BudgetCommittedSourceKindEnum.INSTALLMENT}
            className="flex-row items-center justify-between gap-x-md"
            onPress={handlePress}
        >
            <View className="shrink gap-y-xxs">
                <Text className="text-sm font-medium text-primary" numberOfLines={1}>
                    {charge.title}
                </Text>
                <Text className="text-xs text-secondary-foreground">{t`${dateLabel}, ${kindLabel}`}</Text>
            </View>
            <ProtectedText className="text-sm font-semibold tabular-nums text-primary">
                {formatProtectedAmount(convertFromMicroUnits(charge.amount), currencySymbol)}
            </ProtectedText>
        </HapticPressable>
    );
};
