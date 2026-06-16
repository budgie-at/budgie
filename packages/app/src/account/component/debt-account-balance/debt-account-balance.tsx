import { AccountDebtTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View, ViewStyle } from 'react-native';

import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { BACKGROUND_COLOR_PALETTE } from '../../../@generic/constant/background-color-palette.constant';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_DEBT_TYPE_COLOR } from '../../constant/account-debt-type-color.constant';
import { buildDebtAccountProgressSummary } from '../../utils/build-debt-account-progress-summary.util';

interface Props {
    readonly balance: number;
    readonly creditAmount: number;
    readonly debitAmount: number;
    readonly debtType: AccountDebtTypeEnum;
    readonly targetAmount: number;
    readonly instrumentSymbol: string;
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

export const DebtAccountBalance = ({ balance, creditAmount, debitAmount, debtType, instrumentSymbol, targetAmount }: Props) => {
    const { t } = useLingui();
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const summary = buildDebtAccountProgressSummary({ balance, creditAmount, debitAmount, debtType, targetAmount });
    const variant = ACCOUNT_DEBT_TYPE_COLOR[debtType];
    const { percentage } = summary;
    const barStyle: ViewStyle = { width: `${percentage}%` };
    const balanceLabel = debtType === AccountDebtTypeEnum.BORROW ? t`Left to repay` : t`Left to receive`;
    const progressLabel = debtType === AccountDebtTypeEnum.BORROW ? t`Repayment Progress` : t`Return Progress`;
    const paidLabel = debtType === AccountDebtTypeEnum.BORROW ? t`Repaid` : t`Returned`;
    const totalLabel = debtType === AccountDebtTypeEnum.BORROW ? t`Borrowed` : t`Lent`;

    const formattedPaidAmount = formatDigits(summary.paidAmount, instrumentSymbol);
    const formattedTotalAmount = formatDigits(summary.totalAmount, instrumentSymbol);

    return (
        <View className={containerVariants({ variant })}>
            <Text className="font-medium text-xs uppercase text-secondary-foreground text-center">{balanceLabel}</Text>

            <ProtectedMoney className="justify-start" minFontSize={10} maxFontSize={36} instrumentSymbol={instrumentSymbol}>
                {summary.outstandingAmount}
            </ProtectedMoney>

            <View className="my-3xl h-px bg-secondary-corner" />

            <View className="gap-y-xl">
                <View className="flex-row items-center justify-between">
                    <Text className="text-secondary-foreground text-sm uppercase font-medium">{progressLabel}</Text>

                    <Text className={percentageTextVariants({ variant })}>{percentage}%</Text>
                </View>

                <View className="rounded-5xl bg-secondary-background overflow-hidden">
                    <View className={barVariants({ debtType })} style={barStyle} />
                </View>

                <View className="flex-row items-center justify-between">
                    <Text className="text-secondary-foreground text-sm">
                        {paidLabel}: {formattedPaidAmount}
                    </Text>
                    <Text className="text-secondary-foreground text-sm">
                        {totalLabel}: {formattedTotalAmount}
                    </Text>
                </View>
            </View>
        </View>
    );
};
