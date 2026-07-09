import { InstrumentTypeEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ConvertedAmountLabel } from '../converted-amount-label/converted-amount-label';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { AggregatedTransactionEntryInterface } from '../../interface/aggregated-transaction-entry.interface';

interface Props {
    readonly entry: AggregatedTransactionEntryInterface;
    readonly variant: ColorPaletteVariant;
    readonly testID: string;
}

const amountVariants = cva('text-sm font-semibold text-right', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export const TransactionEntryAmount = ({ entry, variant, testID }: Props) => {
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const amount = convertFromMicroUnits(entry.amount);
    const isCrossCurrency = entry.account.instrument.id !== defaultInstrument.id;
    const shouldShowExchangeRate = entry.account.instrument.type === InstrumentTypeEnum.CRYPTO;

    return (
        <View className="items-end" testID={testID}>
            <Text className={amountVariants({ variant })}>{formatDigits(amount, entry.account.instrument.symbol)}</Text>
            {isCrossCurrency ? (
                <ConvertedAmountLabel
                    instrumentId={entry.account.instrument.id}
                    instrumentSymbol={entry.account.instrument.symbol}
                    amount={entry.amount}
                    baseAmount={entry.baseAmount}
                    shouldShowExchangeRate={shouldShowExchangeRate}
                />
            ) : null}
        </View>
    );
};
