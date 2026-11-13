import { InstrumentTypeEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { isDefined } from '@rnw-community/shared';

import circleFlags from '../../../../assets/flags/circle-flags.json';
import { isListedSecurityType } from '../../../instrument/utils/is-listed-security-type.util';
import { GlyphSizeEnum } from '../../enum/glyph-size.enum';
import { getGlyphSize } from '../../utils/get-glyph-size.util';
import { CryptoCurrencyIcon } from '../crypto-currency-icon/crypto-currency-icon';
import { InstrumentMonogram } from '../instrument-monogram/instrument-monogram';

const CIRCLE_FLAGS: Readonly<Record<string, string>> = circleFlags;

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
}

export const CurrencySelectorInstrumentIcon = ({ code, symbol, type, size = 48 }: Props) => {
    if (type === InstrumentTypeEnum.CRYPTO) {
        return <CryptoCurrencyIcon code={code} size={size} className="bg-surface-disc" />;
    }

    if (isListedSecurityType(type)) {
        return <InstrumentMonogram code={symbol} size={size} />;
    }

    const style = { width: size, height: size } as const;
    const flag = CIRCLE_FLAGS[code.slice(0, 2).toUpperCase()] ?? null;

    if (isDefined(flag)) {
        return (
            <View className="overflow-hidden rounded-full border-hairline border-primary/20" style={style} accessible={false}>
                <SvgXml xml={flag} width={size} height={size} />
            </View>
        );
    }

    const glyphSize = getGlyphSize(symbol);
    const displaySymbol = glyphSize === GlyphSizeEnum.CODE ? code : symbol;
    const textClassName = symbolVariants({ glyphSize });

    return (
        <View className="items-center justify-center rounded-full border-hairline border-primary/20 bg-surface-disc" style={style}>
            <Text className={textClassName} numberOfLines={1}>
                {displaySymbol}
            </Text>
        </View>
    );
};
