import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { StatChip } from '../../../@generic/component/stat-chip/stat-chip';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

import { NetWorthAssetChipsSelector } from './net-worth-asset-chips.selector';

interface Props {
    readonly fiatTotal: number;
    readonly cryptoTotal: number;
    readonly fiatCount: number;
    readonly cryptoCount: number;
}

export const NetWorthAssetChips = ({ fiatTotal, cryptoTotal, fiatCount, cryptoCount }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();

    const shouldShowChips = isPositiveNumber(fiatCount) && isPositiveNumber(cryptoCount);

    if (!shouldShowChips) {
        return null;
    }

    const formattedFiatTotal = formatDigits(fiatTotal, defaultInstrument.symbol);
    const formattedCryptoTotal = formatDigits(cryptoTotal, defaultInstrument.symbol);

    return (
        <View className="flex-row gap-x-sm" testID={NetWorthAssetChipsSelector.Container}>
            <StatChip
                icon={UserIconNameEnum.Banknote}
                iconClassName="text-secondary-foreground"
                value={formattedFiatTotal}
                testID={NetWorthAssetChipsSelector.Fiat}
            />
            <StatChip
                icon={UserIconNameEnum.Coins}
                iconClassName="text-warning-foreground"
                value={formattedCryptoTotal}
                testID={NetWorthAssetChipsSelector.Crypto}
            />
        </View>
    );
};
