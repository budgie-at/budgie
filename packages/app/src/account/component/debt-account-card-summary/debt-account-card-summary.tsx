import { View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { abbreviateNumber } from '../../../@generic/utils/abbriviate-number.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

import { DebtAccountCardSummarySelector } from './debt-account-card-summary.selector';

interface Props {
    readonly instrumentSymbol: string;
    readonly outstandingAmount: number;
    readonly paidAmount: number;
    readonly title: string;
    readonly totalAmount: number;
}

export const DebtAccountCardSummary = ({ instrumentSymbol, outstandingAmount, paidAmount, title, totalAmount }: Props) => {
    const { decimalPlaces } = useSettingsContext();
    const formatMoney = useFormatDigits(decimalPlaces);
    const amountLeft = formatMoney(outstandingAmount, instrumentSymbol);
    const compactPaidAmountLabel = `${instrumentSymbol}${abbreviateNumber(paidAmount, 2)}`;
    const totalAmountLabel = `${instrumentSymbol}${abbreviateNumber(totalAmount, 2)}`;
    const outstandingAmountSelector = DebtAccountCardSummarySelector.OutstandingAmount(title, outstandingAmount);
    const paidAmountSelector = DebtAccountCardSummarySelector.PaidAmount(title, paidAmount);
    const totalAmountSelector = DebtAccountCardSummarySelector.TotalAmount(title, totalAmount);

    return (
        <View className="flex-row items-center">
            <View className="flex-1 min-w-0 pr-md">
                <ProtectedText
                    adjustsFontSizeToFit
                    className="text-primary font-medium"
                    ellipsizeMode="tail"
                    minimumFontScale={0.72}
                    numberOfLines={1}
                    testID={outstandingAmountSelector}
                >
                    {amountLeft}
                </ProtectedText>
            </View>

            <View className="shrink-0 items-end max-w-[45%]">
                <ProtectedText
                    adjustsFontSizeToFit
                    className="text-secondary-foreground text-xxs font-medium text-right border-b border-b-primary pb-[2px]"
                    minimumFontScale={0.72}
                    numberOfLines={1}
                    testID={paidAmountSelector}
                >
                    {compactPaidAmountLabel}
                </ProtectedText>
                <ProtectedText
                    adjustsFontSizeToFit
                    className="text-primary text-xxs font-semibold text-right"
                    minimumFontScale={0.72}
                    numberOfLines={1}
                    testID={totalAmountSelector}
                >
                    {totalAmountLabel}
                </ProtectedText>
            </View>
        </View>
    );
};
