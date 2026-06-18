import { AccountDebtTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View, type ViewStyle } from 'react-native';

import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { BACKGROUND_COLOR_PALETTE } from '../../../@generic/constant/background-color-palette.constant';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_DEBT_TYPE_COLOR } from '../../constant/account-debt-type-color.constant';

import { DebtAccountBalanceSelector } from './debt-account-balance.selector';

import type { DebtAccountProgressSummaryInterface } from '../../interface/debt-account-progress-summary.interface';

interface Props {
    readonly debtType: AccountDebtTypeEnum;
    readonly instrumentSymbol: string;
    readonly summary: DebtAccountProgressSummaryInterface;
}

const containerVariants = cva('p-5xl border gap-y-md rounded-3xl', {
    variants: { variant: BACKGROUND_COLOR_PALETTE }
});

const percentageTextVariants = cva('text-sm font-semibold', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

const barVariants = cva('rounded-5xl min-w-0.5 h-2', {
    variants: {
        debtType: {
            [AccountDebtTypeEnum.LENT]: 'bg-positive-foreground',
            [AccountDebtTypeEnum.BORROW]: 'bg-warning-foreground'
        }
    }
});

export const DebtAccountBalance = ({ debtType, instrumentSymbol, summary }: Props) => {
    const { t } = useLingui();
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const variant = ACCOUNT_DEBT_TYPE_COLOR[debtType];
    const { outstandingAmount, paidAmount, percentage, totalAmount } = summary;
    const barStyle: ViewStyle = { width: `${percentage}%` };
    const labels = {
        balance: debtType === AccountDebtTypeEnum.BORROW ? t`Left to repay` : t`Left to receive`,
        paid: debtType === AccountDebtTypeEnum.BORROW ? t`Repaid` : t`Returned`,
        progress: debtType === AccountDebtTypeEnum.BORROW ? t`Repayment Progress` : t`Return Progress`,
        total: debtType === AccountDebtTypeEnum.BORROW ? t`Borrowed` : t`Lent`
    };
    const formattedPaidAmount = formatDigits(paidAmount, instrumentSymbol);
    const formattedTotalAmount = formatDigits(totalAmount, instrumentSymbol);
    const outstandingAmountSelector = DebtAccountBalanceSelector.OutstandingAmount(outstandingAmount);
    const paidAmountSelector = DebtAccountBalanceSelector.PaidAmount(paidAmount);
    const percentageSelector = DebtAccountBalanceSelector.Percentage(percentage);
    const totalAmountSelector = DebtAccountBalanceSelector.TotalAmount(totalAmount);

    return (
        <View className={containerVariants({ variant })}>
            <Text className="font-medium text-xs uppercase text-secondary-foreground text-center">{labels.balance}</Text>

            <ProtectedMoney
                className="justify-start"
                minFontSize={10}
                maxFontSize={36}
                instrumentSymbol={instrumentSymbol}
                testID={outstandingAmountSelector}
            >
                {outstandingAmount}
            </ProtectedMoney>

            <View className="my-3xl h-px bg-secondary-corner" />

            <View className="gap-y-xl">
                <View className="flex-row items-center justify-between">
                    <Text className="text-secondary-foreground text-sm uppercase font-medium">{labels.progress}</Text>

                    <Text className={percentageTextVariants({ variant })} testID={percentageSelector}>
                        {percentage}%
                    </Text>
                </View>

                <View className="rounded-5xl bg-secondary-background overflow-hidden">
                    <View className={barVariants({ debtType })} style={barStyle} />
                </View>

                <View className="flex-row items-center justify-between">
                    <Text className="text-secondary-foreground text-sm" testID={paidAmountSelector}>
                        {labels.paid}: {formattedPaidAmount}
                    </Text>
                    <Text className="text-secondary-foreground text-sm" testID={totalAmountSelector}>
                        {labels.total}: {formattedTotalAmount}
                    </Text>
                </View>
            </View>
        </View>
    );
};
