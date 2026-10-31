import { InstrumentTypeEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { TONAL_DISC_BACKGROUND } from '../../constant/tonal-disc-background.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { CurrencySelectorInstrumentIcon } from '../currency-selector-instrument-icon/currency-selector-instrument-icon';

interface Props {
    readonly code: string;
    readonly symbol: string;
    readonly instrumentType: InstrumentTypeEnum;
    readonly variant: ColorPaletteVariant;
}

export const AccountCurrencyIcon = ({ code, symbol, instrumentType, variant }: Props) => {
    if (instrumentType !== InstrumentTypeEnum.FIAT) {
        return <CurrencySelectorInstrumentIcon code={code} symbol={symbol} type={instrumentType} size={36} />;
    }

    return (
        <View className={cn('h-[36px] w-[36px] items-center justify-center rounded-full', TONAL_DISC_BACKGROUND[variant])}>
            <Text className={cn('text-lg font-medium', FOREGROUND_COLOR_PALETTE[variant])}>{symbol}</Text>
        </View>
    );
};
