import { AccountDebtTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { DebtProgressTrack } from '../debt-progress-track/debt-progress-track';

import { DebtAccountBalanceSelector } from './debt-account-balance.selector';

import type { DebtAccountProgressSummaryInterface } from '../../interface/debt-account-progress-summary.interface';

interface Props {
    readonly debtType: AccountDebtTypeEnum;
    readonly instrumentSymbol: string;
    readonly summary: DebtAccountProgressSummaryInterface;
}

// eslint-disable-next-line max-statements -- Debt balance component with many derived labels and test selectors
export const DebtAccountBalance = ({ debtType, instrumentSymbol, summary }: Props) => {
    const { t } = useLingui();
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const { outstandingAmount, paidAmount, percentage, totalAmount } = summary;

    const directionLabel = debtType === AccountDebtTypeEnum.BORROW ? t`Left to repay` : t`Left to receive`;
    const paidLabel = debtType === AccountDebtTypeEnum.BORROW ? t`Repaid` : t`Returned`;
    const totalLabel = debtType === AccountDebtTypeEnum.BORROW ? t`Borrowed` : t`Lent`;
    const directionIcon: UserIconNameEnum =
        debtType === AccountDebtTypeEnum.BORROW ? UserIconNameEnum.ArrowDownLeft : UserIconNameEnum.ArrowUpRight;

    const formattedOutstandingAmount = formatDigits(outstandingAmount, instrumentSymbol);
    const formattedPaidAmount = formatDigits(paidAmount, instrumentSymbol);
    const formattedTotalAmount = formatDigits(totalAmount, instrumentSymbol);
    const paidAmountSelector = DebtAccountBalanceSelector.PaidAmount(paidAmount);
    const percentageSelector = DebtAccountBalanceSelector.Percentage(percentage);
    const totalAmountSelector = DebtAccountBalanceSelector.TotalAmount(totalAmount);
    const accessibilityLabel = `${directionLabel}: ${formattedOutstandingAmount}. ${paidLabel}: ${formattedPaidAmount}. ${totalLabel}: ${formattedTotalAmount}. ${percentage}%`;

    return (
        <View
            accessible
            accessibilityLabel={accessibilityLabel}
            className="p-5xl border gap-y-md rounded-3xl border-secondary-corner bg-ghost-background"
        >
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-x-xs min-w-0">
                    <Icon icon={directionIcon} size={12} className="text-secondary-foreground" />
                    <Text className="text-secondary-foreground text-sm uppercase font-medium" numberOfLines={1}>
                        {directionLabel}
                    </Text>
                </View>

                <Text className="text-sm font-semibold text-primary" testID={percentageSelector}>
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
                <Text className="text-secondary-foreground text-sm" testID={paidAmountSelector}>
                    {paidLabel}: {formattedPaidAmount}
                </Text>
                <Text className="text-secondary-foreground text-sm" testID={totalAmountSelector}>
                    {totalLabel}: {formattedTotalAmount}
                </Text>
            </View>
        </View>
    );
};
