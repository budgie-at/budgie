import { AccountDebtTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ProgressTrack } from '../../../@generic/component/progress-track/progress-track';
import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { dismissAllOrReplace } from '../../../@generic/utils/dismiss-all-or-replace.util';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { DEBT_SETTLED_LABEL } from '../../constant/debt-settled-label.constant';
import { useArchiveAccount } from '../../hooks/use-archive-account.hook';
import { getDebtProgressDisplayState } from '../../utils/get-debt-progress-display-state.util';
import { DebtAccountBalanceSelector } from '../debt-account-balance/debt-account-balance.selector';

import { DebtAccountPaidOffSelector } from './debt-account-paid-off.selector';

import type { DebtAccountProgressSummaryInterface } from '@budgie/contracts';

interface Props {
    readonly accountId: number;
    readonly debtType: AccountDebtTypeEnum;
    readonly instrumentSymbol: string;
    readonly summary: Pick<DebtAccountProgressSummaryInterface, 'outstandingAmount' | 'overpaidAmount' | 'paidAmount' | 'totalAmount'>;
}

export const DebtAccountPaidOff = ({ accountId, debtType, instrumentSymbol, summary }: Props) => {
    const { t } = useLingui();
    const protectAmount = useProtectedAmountLabel();
    const { decimalPlaces } = useSettingsContext();
    const { handleArchive, isLoading } = useArchiveAccount(accountId, () => void dismissAllOrReplace('/'));

    const { overpaidAmount, paidAmount, totalAmount } = summary;
    const { isOverpaid } = getDebtProgressDisplayState(summary, decimalPlaces);
    const settledLabel = t(DEBT_SETTLED_LABEL[debtType]);
    const totalLabel = t`Total`;
    const overpaidLabel = t`Overpaid`;
    const formattedTotalAmount = protectAmount(totalAmount, instrumentSymbol);
    const formattedOverpaidAmount = protectAmount(overpaidAmount, instrumentSymbol);
    const overpaidAccessibilityLabel = isOverpaid ? ` ${overpaidLabel}: ${formattedOverpaidAmount}.` : '';
    const accessibilityLabel = `${settledLabel}: ${protectAmount(paidAmount, instrumentSymbol)}. ${totalLabel}: ${formattedTotalAmount}.${overpaidAccessibilityLabel}`;

    return (
        <View
            className="p-5xl border gap-y-md rounded-3xl border-secondary-corner bg-ghost-background items-center"
            testID={DebtAccountPaidOffSelector.Root}
        >
            <View accessible accessibilityLabel={accessibilityLabel} className="w-full items-center gap-y-md">
                <CircleIcon icon={UserIconNameEnum.Check} variant="positive" size={56} radius={28} iconSize={28} />

                <Text className="text-lg font-semibold text-positive-foreground">{settledLabel}</Text>

                <ProtectedMoney
                    accessible
                    className="justify-center"
                    minFontSize={10}
                    maxFontSize={36}
                    instrumentSymbol={instrumentSymbol}
                    testID={DebtAccountBalanceSelector.PaidAmount(paidAmount)}
                >
                    {paidAmount}
                </ProtectedMoney>

                <ProgressTrack percentage={100} className="h-2.5 w-full" fillClassName="bg-positive-foreground" />

                <Text className="text-secondary-foreground text-sm" testID={DebtAccountBalanceSelector.TotalAmount(totalAmount)}>
                    {totalLabel}: {formattedTotalAmount}
                </Text>

                {isOverpaid ? (
                    <Text className="text-warning-foreground text-sm" testID={DebtAccountBalanceSelector.OverpaidAmount(overpaidAmount)}>
                        {overpaidLabel}: {formattedOverpaidAmount}
                    </Text>
                ) : null}
            </View>

            <Button
                variant="ghost"
                size="sm"
                leftIcon={UserIconNameEnum.Archive}
                content={t`Archive`}
                onPress={handleArchive}
                isLoading={isLoading}
                testID={DebtAccountPaidOffSelector.ArchiveButton}
            />
        </View>
    );
};
