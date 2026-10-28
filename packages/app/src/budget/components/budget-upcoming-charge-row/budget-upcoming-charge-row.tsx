import { BudgetCommittedSourceKindEnum } from '@budgie/budget';
import { UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HorizontalCell } from '../../../@generic/component/horizontal-cell/horizontal-cell';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

import type { BudgetUpcomingChargeInterface } from '@budgie/budget';
import type { UserIconType } from '@budgie/contracts';
import type { MessageDescriptor } from '@lingui/core';

interface Props {
    readonly charge: BudgetUpcomingChargeInterface;
    readonly currencySymbol: string;
}

const SOURCE_PRESENTATION: Record<BudgetCommittedSourceKindEnum, { readonly icon: UserIconType; readonly label: MessageDescriptor }> = {
    [BudgetCommittedSourceKindEnum.RECURRING]: { icon: UserIconNameEnum.Repeat, label: msg`Recurring` },
    [BudgetCommittedSourceKindEnum.INSTALLMENT]: { icon: UserIconNameEnum.CreditCard, label: msg`Installment` }
};

export const BudgetUpcomingChargeRow = ({ charge, currencySymbol }: Props) => {
    const { t } = useLingui();
    const formatProtectedAmount = useProtectedAmountLabel();
    const { formatMonthAndDay } = useFormatDate();
    const presentation = SOURCE_PRESENTATION[charge.source.kind];
    const dateLabel = formatMonthAndDay(charge.date);
    const kindLabel = t(presentation.label);
    const isInstallment = charge.source.kind === BudgetCommittedSourceKindEnum.INSTALLMENT;

    const handlePress = () => {
        router.push({ pathname: '/account/[id]/details', params: { id: String(charge.source.id) } });
    };

    return (
        <HorizontalCell
            left={<CircleIcon icon={presentation.icon} variant="primary" />}
            right={
                <ProtectedText className="ml-auto text-md font-semibold tabular-nums text-primary">
                    {formatProtectedAmount(convertFromMicroUnits(charge.amount), currencySymbol)}
                </ProtectedText>
            }
            {...(isInstallment && { onPress: handlePress })}
        >
            <Text className="text-sm font-medium text-primary" numberOfLines={1}>
                {charge.title}
            </Text>
            <Text className="text-sm text-secondary-foreground">{t`${dateLabel} · ${kindLabel}`}</Text>
        </HorizontalCell>
    );
};
