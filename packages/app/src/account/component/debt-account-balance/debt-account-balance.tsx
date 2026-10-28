import { AccountDebtTypeEnum, UserIconNameEnum, isBorrowLikeDebtType } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { ProgressTrack } from '../../../@generic/component/progress-track/progress-track';
import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { decimalPlacesAtom } from '../../../settings/constants/settings-atoms.constant';
import { DEBT_REMAINING_LABEL } from '../../constant/debt-remaining-label.constant';
import { DEBT_SETTLED_LABEL } from '../../constant/debt-settled-label.constant';
import { getDebtProgressDisplayState } from '../../utils/get-debt-progress-display-state.util';
import { DebtAccountBalanceSkeleton } from '../debt-account-balance-skeleton/debt-account-balance-skeleton';
import { DebtAccountPaidOff } from '../debt-account-paid-off/debt-account-paid-off';

import { DebtAccountBalanceSelector } from './debt-account-balance.selector';

import type { DebtAccountProgressSummaryInterface } from '@budgie/contracts';

interface Props {
    readonly accountId: number;
    readonly debtType: AccountDebtTypeEnum;
    readonly instrumentSymbol: string;
    readonly summary: DebtAccountProgressSummaryInterface | null;
}

export const DebtAccountBalance = ({ accountId, debtType, instrumentSymbol, summary }: Props) => {
    const { t } = useLingui();
    const protectAmount = useProtectedAmountLabel();
    const decimalPlaces = useAtomValue(decimalPlacesAtom);

    if (!isDefined(summary)) {
        return <DebtAccountBalanceSkeleton />;
    }

    const { isSettled, isOverpaid } = getDebtProgressDisplayState(summary, decimalPlaces);

    if (isSettled) {
        return <DebtAccountPaidOff accountId={accountId} debtType={debtType} instrumentSymbol={instrumentSymbol} summary={summary} />;
    }

    const { outstandingAmount, overpaidAmount, paidAmount, percentage, totalAmount } = summary;
    const borrowed = isBorrowLikeDebtType(debtType);
    const borrowedTotalLabel = debtType === AccountDebtTypeEnum.INSTALLMENT ? t`Total` : t`Borrowed`;

    const labels = {
        directionIcon: borrowed ? UserIconNameEnum.ArrowDownLeft : UserIconNameEnum.ArrowUpRight,
        directionLabel: t(DEBT_REMAINING_LABEL[debtType]),
        overpaidLabel: t`Overpaid`,
        paidLabel: t(DEBT_SETTLED_LABEL[debtType]),
        totalLabel: borrowed ? borrowedTotalLabel : t`Lent`,
        formattedOverpaidAmount: protectAmount(overpaidAmount, instrumentSymbol),
        formattedPaidAmount: protectAmount(paidAmount, instrumentSymbol),
        formattedTotalAmount: protectAmount(totalAmount, instrumentSymbol)
    };
    const overpaidAccessibilityLabel = isOverpaid ? ` ${labels.overpaidLabel}: ${labels.formattedOverpaidAmount}.` : '';
    const accessibilityLabel = `${labels.directionLabel}: ${protectAmount(outstandingAmount, instrumentSymbol)}. ${labels.paidLabel}: ${labels.formattedPaidAmount}. ${labels.totalLabel}: ${labels.formattedTotalAmount}.${overpaidAccessibilityLabel} ${percentage}%`;

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
                containerClassName="justify-start"
                minFontSize={10}
                maxFontSize={36}
                instrumentSymbol={instrumentSymbol}
                testID={DebtAccountBalanceSelector.OutstandingAmount(outstandingAmount)}
            >
                {outstandingAmount}
            </ProtectedMoney>

            <ProgressTrack percentage={percentage} className="h-2.5" />

            <View className="flex-row items-center justify-between">
                <Text className="text-secondary-foreground text-sm" testID={DebtAccountBalanceSelector.PaidAmount(paidAmount)}>
                    {labels.paidLabel}: {labels.formattedPaidAmount}
                </Text>
                <Text className="text-secondary-foreground text-sm" testID={DebtAccountBalanceSelector.TotalAmount(totalAmount)}>
                    {labels.totalLabel}: {labels.formattedTotalAmount}
                </Text>
            </View>

            {isOverpaid ? (
                <Text className="text-warning-foreground text-sm" testID={DebtAccountBalanceSelector.OverpaidAmount(overpaidAmount)}>
                    {labels.overpaidLabel}: {labels.formattedOverpaidAmount}
                </Text>
            ) : null}
        </View>
    );
};
