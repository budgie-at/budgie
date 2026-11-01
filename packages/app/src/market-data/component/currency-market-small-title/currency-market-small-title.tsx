import { useAtomValue } from '@effect/atom-react/Hooks';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { getMarketPriceFractionDigits } from '../../utils/get-market-price-fraction-digits.util';

import type { InstrumentDailyMarketPriceEntityInterface } from '@budgie/contracts';

interface Props {
    readonly instrumentName: string;
    readonly latestPrice: Pick<InstrumentDailyMarketPriceEntityInterface, 'price'> | undefined;
}

const MIN_FRACTION_DIGITS = 2;

export const CurrencyMarketSmallTitle = ({ instrumentName, latestPrice }: Props) => {
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const formatPrice = useFormatDigits(MIN_FRACTION_DIGITS, getMarketPriceFractionDigits(latestPrice?.price ?? 0));

    return (
        <View className="items-center" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Text className="text-primary text-center text-[17px] leading-[20px] font-semibold" numberOfLines={1}>
                {instrumentName}
            </Text>
            {isDefined(latestPrice) ? (
                <Text className="text-secondary-foreground text-center text-[12px] leading-[15px] tabular-nums" numberOfLines={1}>
                    {formatPrice(latestPrice.price, symbol)}
                </Text>
            ) : null}
        </View>
    );
};
