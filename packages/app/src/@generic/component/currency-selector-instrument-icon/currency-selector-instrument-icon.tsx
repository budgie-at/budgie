import { InstrumentTypeEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { isDefined } from '@rnw-community/shared';

import { GlyphSizeEnum } from '../../enum/glyph-size.enum';
import { getCurrencyFlag } from '../../utils/get-currency-flag.util';
import { getGlyphSize } from '../../utils/get-glyph-size.util';
import { CryptoCurrencyIcon } from '../crypto-currency-icon/crypto-currency-icon';

const symbolVariants = cva<{ glyphSize: Record<GlyphSizeEnum, string> }>('text-primary font-semibold', {
    variants: {
        glyphSize: {
            [GlyphSizeEnum.SINGLE]: 'text-[17px]',
            [GlyphSizeEnum.PAIR]: 'text-[15px]',
            [GlyphSizeEnum.CODE]: 'text-[11px] tracking-[0.2px]'
        }
    }
});

interface Props {
    readonly code: string;
    readonly symbol: string;
    readonly type: InstrumentTypeEnum;
    readonly size?: number;
    readonly isLargeFiatSymbol?: boolean;
}

export const CurrencySelectorInstrumentIcon = ({ code, symbol, type, size = 48, isLargeFiatSymbol = false }: Props) => {
    if (type === InstrumentTypeEnum.CRYPTO) {
        return <CryptoCurrencyIcon code={code} size={size} className="bg-surface-disc border-hairline border-primary/25" />;
    }

    const style = { width: size, height: size } as const;
    const flag = isLargeFiatSymbol ? null : getCurrencyFlag(code);

    if (isDefined(flag)) {
        return (
            <View className="overflow-hidden rounded-full border-hairline border-primary/20" style={style} accessible={false}>
                <SvgXml xml={flag} width={size} height={size} />
            </View>
        );
    }

    const glyphSize = getGlyphSize(symbol);
    const displaySymbol = glyphSize === GlyphSizeEnum.CODE ? code : symbol;
    const textClassName = isLargeFiatSymbol ? 'text-primary text-4xl' : symbolVariants({ glyphSize });

    return (
        <View className="items-center justify-center rounded-full border-hairline border-primary/20 bg-surface-disc" style={style}>
            <Text className={textClassName} numberOfLines={1}>
                {displaySymbol}
            </Text>
        </View>
    );
};
