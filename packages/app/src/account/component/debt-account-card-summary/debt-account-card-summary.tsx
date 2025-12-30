import { AccountDebtTypeEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { abbreviateNumber } from '../../../@generic/utils/abbriviate-number.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_DEBT_TYPE_COLOR } from '../../constant/account-debt-type-color.constant';

interface Props {
    readonly targetBalance: number;
    readonly currentBalance: number;
    readonly instrumentSymbol: string;
    readonly debtType: AccountDebtTypeEnum;
}

const textVariant = cva('flex-1 text-xxs font-semibold text-right border-b border-b-secondary-corner pb-[2px]', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export const DebtAccountCardSummary = ({ targetBalance, instrumentSymbol, currentBalance, debtType }: Props) => {
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatMoney = useFormatDigits(decimalPlaces);
    const amountLeft = formatMoney(Math.max(targetBalance - currentBalance, 0), defaultInstrument.symbol);

    return (
        <View className="flex-row items-center justify-between">
            <ProtectedText className="text-primary font-medium">{amountLeft}</ProtectedText>

            <View className="flex-1">
                <ProtectedText className={textVariant({ variant: ACCOUNT_DEBT_TYPE_COLOR[debtType] })}>
                    {instrumentSymbol}
                    {abbreviateNumber(currentBalance, 2)}
                </ProtectedText>
                <ProtectedText className="text-secondary-foreground text-xxs font-medium text-right">
                    {instrumentSymbol}
                    {abbreviateNumber(targetBalance, 2)}
                </ProtectedText>
            </View>
        </View>
    );
};
