import { InstrumentTypeEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useCryptoInstrumentTotalQuery } from '../../../account/query/use-crypto-instrument-total.query';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

import type { InstrumentDailyMarketPriceEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly instrument: InstrumentEntityInterface;
    readonly latestPrice: InstrumentDailyMarketPriceEntityInterface | undefined;
}

const MISSING_VALUE = '-';

export const CurrencyMarketHoldingsCard = ({ instrument, latestPrice }: Props) => {
    const { defaultInstrument } = useSettingsContext();
    const balance = useCryptoInstrumentTotalQuery(instrument.id);
    const formatDigits = useDisplayFormatDigits();
    const hasPrice = isDefined(latestPrice);
    const price = latestPrice?.price ?? 0;
    const value = balance * price;
    const formattedBalance = `${formatDigits(balance)} ${instrument.code}`;
    const formattedValue = hasPrice ? formatDigits(value, defaultInstrument.symbol) : MISSING_VALUE;

    if (instrument.type !== InstrumentTypeEnum.CRYPTO) {
        return null;
    }

    return (
        <View className="border-warning-corner bg-secondary-background rounded-5xl border p-4xl gap-y-lg">
            <View className="flex-row items-center justify-between gap-x-lg">
                <Text className="text-secondary-foreground text-xs uppercase">
                    <Trans>Your holdings</Trans>
                </Text>
                <Text className="text-warning-foreground text-xs font-semibold uppercase">{instrument.code}</Text>
            </View>

            <View className="flex-row items-end justify-between gap-x-lg">
                <ProtectedText selectable className="text-primary text-3xl font-semibold" placeholderText="***">
                    {formattedBalance}
                </ProtectedText>
                <ProtectedText selectable className="text-secondary-foreground text-lg font-medium" placeholderText="~ ***">
                    ~ {formattedValue}
                </ProtectedText>
            </View>
        </View>
    );
};
