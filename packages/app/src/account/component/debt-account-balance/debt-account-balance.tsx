import { AccountDebtTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { DEBT_REMAINING_LABEL } from '../../constant/debt-remaining-label.constant';
import { DEBT_SETTLED_LABEL } from '../../constant/debt-settled-label.constant';
import { DebtProgressTrack } from '../debt-progress-track/debt-progress-track';

import { DebtAccountBalanceSelector } from './debt-account-balance.selector';

import type { DebtAccountProgressSummaryInterface } from '@budgie/contracts';

interface Props {
    readonly debtType: AccountDebtTypeEnum;
    readonly instrumentSymbol: string;
    readonly summary: DebtAccountProgressSummaryInterface;
}

export const DebtAccountBalance = ({ debtType, instrumentSymbol, summary }: Props) => {
    const { t } = useLingui();
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const protectAmount = useProtectedAmountLabel();

    const { outstandingAmount, paidAmount, percentage, totalAmount } = summary;
    const borrowed = debtType === AccountDebtTypeEnum.BORROW;

    const labels = {
        directionIcon: borrowed ? UserIconNameEnum.ArrowDownLeft : UserIconNameEnum.ArrowUpRight,
        directionLabel: t(DEBT_REMAINING_LABEL[debtType]),
        paidLabel: t(DEBT_SETTLED_LABEL[debtType]),
        totalLabel: borrowed ? t`Borrowed` : t`Lent`
    };
    const formattedPaidAmount = formatDigits(paidAmount, instrumentSymbol);
    const formattedTotalAmount = formatDigits(totalAmount, instrumentSymbol);
    const accessibilityLabel = `${labels.directionLabel}: ${protectAmount(outstandingAmount, instrumentSymbol)}. ${labels.paidLabel}: ${protectAmount(paidAmount, instrumentSymbol)}. ${labels.totalLabel}: ${protectAmount(totalAmount, instrumentSymbol)}. ${percentage}%`;

    return (
        <View
            accessible
            accessibilityLabel={accessibilityLabel}
            className="p-5xl border gap-y-md rounded-3xl border-secondary-corner bg-ghost-background"
        >
            <View className="flex-row items-center justify-between gap-x-sm">
                <View className="flex-row flex-1 items-center gap-x-xs min-w-0">
                    <Icon icon={labels.directionIcon} size={12} className="text-secondary-foreground" />
                    <Text className="text-secondary-foreground text-sm uppercase font-medium flex-shrink" numberOfLines={1}>
                        {labels.directionLabel}
                    </Text>
                </View>

                <Text className="text-sm font-semibold text-primary" testID={DebtAccountBalanceSelector.Percentage(percentage)}>
                    {percentage}%
                </Text>
            </View>

            <ProtectedMoney
                accessible
                className="justify-start"
                minFontSize={10}
                maxFontSize={36}
                instrumentSymbol={instrumentSymbol}
                testID={DebtAccountBalanceSelector.OutstandingAmount(outstandingAmount)}
            >
                {outstandingAmount}
            </ProtectedMoney>

            <DebtProgressTrack percentage={percentage} className="h-2.5" />

            <View className="flex-row items-center justify-between">
                <Text className="text-secondary-foreground text-sm" testID={DebtAccountBalanceSelector.PaidAmount(paidAmount)}>
                    {labels.paidLabel}: {formattedPaidAmount}
                </Text>
                <Text className="text-secondary-foreground text-sm" testID={DebtAccountBalanceSelector.TotalAmount(totalAmount)}>
                    {labels.totalLabel}: {formattedTotalAmount}
                </Text>
            </View>
        </View>
    );
};
