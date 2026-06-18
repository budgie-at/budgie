import { AccountDebtTypeEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { abbreviateNumber } from '../../../@generic/utils/abbriviate-number.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_DEBT_TYPE_COLOR } from '../../constant/account-debt-type-color.constant';

import { DebtAccountCardSummarySelector } from './debt-account-card-summary.selector';

interface Props {
    readonly debtType: AccountDebtTypeEnum;
    readonly instrumentSymbol: string;
    readonly outstandingAmount: number;
    readonly percentage: number;
    readonly title: string;
    readonly totalAmount: number;
}

const textVariant = cva('flex-1 text-xxs font-semibold text-right border-b border-b-secondary-corner pb-[2px]', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export const DebtAccountCardSummary = ({ debtType, instrumentSymbol, outstandingAmount, percentage, title, totalAmount }: Props) => {
    const { decimalPlaces } = useSettingsContext();
    const formatMoney = useFormatDigits(decimalPlaces);
    const amountLeft = formatMoney(outstandingAmount, instrumentSymbol);
    const compactOutstandingAmountLabel = `${instrumentSymbol}${abbreviateNumber(outstandingAmount, 2)}`;
    const totalAmountLabel = `${instrumentSymbol}${abbreviateNumber(totalAmount, 2)}`;
    const outstandingAmountSelector = DebtAccountCardSummarySelector.OutstandingAmount(title, outstandingAmount);
    const percentageSelector = DebtAccountCardSummarySelector.Percentage(title, percentage);
    const totalAmountSelector = DebtAccountCardSummarySelector.TotalAmount(title, totalAmount);

    return (
        <View className="flex-row items-center justify-between">
            <ProtectedText className="text-primary font-medium" testID={outstandingAmountSelector}>
                {amountLeft}
            </ProtectedText>

            <View>
                <ProtectedText className={textVariant({ variant: ACCOUNT_DEBT_TYPE_COLOR[debtType] })} testID={percentageSelector}>
                    {compactOutstandingAmountLabel}
                </ProtectedText>
                <ProtectedText className="text-secondary-foreground text-xxs font-medium text-right" testID={totalAmountSelector}>
                    {totalAmountLabel}
                </ProtectedText>
            </View>
        </View>
    );
};
