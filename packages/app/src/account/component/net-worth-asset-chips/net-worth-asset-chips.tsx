import { UserIconNameEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly fiatTotal: number;
    readonly cryptoTotal: number;
    readonly fiatCount: number;
    readonly cryptoCount: number;
}

export const NetWorthAssetChips = ({ fiatTotal, cryptoTotal, fiatCount, cryptoCount }: Props) => {
    const { defaultInstrument } = useSettingsContext();
    const formatDigits = useDisplayFormatDigits();

    const shouldShowChips = isPositiveNumber(fiatCount) && isPositiveNumber(cryptoCount);

    if (!shouldShowChips) {
        return null;
    }

    const formattedFiatTotal = formatDigits(fiatTotal, defaultInstrument.symbol);
    const formattedCryptoTotal = formatDigits(cryptoTotal, defaultInstrument.symbol);

    return (
        <View className="flex-row gap-x-sm mt-lg">
            <View className="flex-row items-center gap-x-xs rounded-full bg-secondary-background border border-secondary-corner px-md py-xs">
                <Icon icon={UserIconNameEnum.Banknote} size={14} className="text-secondary-foreground" />
                <ProtectedText className="text-primary text-xs font-medium">{formattedFiatTotal}</ProtectedText>
            </View>

            <View className="flex-row items-center gap-x-xs rounded-full bg-secondary-background border border-secondary-corner px-md py-xs">
                <Icon icon={UserIconNameEnum.Coins} size={14} className="text-warning-foreground" />
                <ProtectedText className="text-primary text-xs font-medium">{formattedCryptoTotal}</ProtectedText>
            </View>
        </View>
    );
};
