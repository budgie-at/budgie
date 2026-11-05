import { useAtomValue } from '@effect/atom-react/Hooks';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { decimalPlacesAtom } from '../../../settings/constants/settings-atoms.constant';
import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/row-max-font-size-multiplier.constant';
import { MoneyTextVariantEnum } from '../../enum/money-text-variant.enum';
import { useProtectedAmountLabel } from '../../hook/use-protected-amount-label.hook';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { toTrueMinus } from '../../utils/to-true-minus.util';
import { ProtectedText } from '../protected-text/protected-text';

interface Props {
    readonly amount: number;
    readonly instrumentSymbol: string;
    readonly variant: MoneyTextVariantEnum;
    readonly prefix?: string;
    readonly tone?: ColorPaletteVariant;
    readonly testID?: string;
}

const MUTED_VARIANTS = new Set([MoneyTextVariantEnum.LINE, MoneyTextVariantEnum.CAPTION]);

const wholeVariants = cva('tabular-nums', {
    variants: {
        variant: {
            [MoneyTextVariantEnum.HERO]: 'text-center text-[44px] leading-[48px] font-semibold tracking-[-1px]',
            [MoneyTextVariantEnum.FIELD]: 'text-[40px] font-semibold tracking-[-1px]',
            [MoneyTextVariantEnum.ROW]: 'text-[17px] font-semibold tracking-tight',
            [MoneyTextVariantEnum.BODY]: 'text-[15px] font-semibold',
            [MoneyTextVariantEnum.LINE]: 'text-[15px] leading-[20px] text-secondary-foreground',
            [MoneyTextVariantEnum.CAPTION]: 'text-[13px] text-secondary-foreground'
        }
    }
});

const fractionVariants = cva('text-secondary-foreground', {
    variants: {
        variant: {
            [MoneyTextVariantEnum.HERO]: 'text-[26px] font-semibold',
            [MoneyTextVariantEnum.FIELD]: 'text-[24px] font-semibold',
            [MoneyTextVariantEnum.ROW]: 'text-[13px] font-medium',
            [MoneyTextVariantEnum.BODY]: 'text-[13px] font-medium',
            [MoneyTextVariantEnum.LINE]: 'text-[13px]',
            [MoneyTextVariantEnum.CAPTION]: 'text-[11px]'
        }
    }
});

export const MoneyText = ({ amount, instrumentSymbol, variant, prefix = '', tone, testID }: Props) => {
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const formatDigits = useFormatDigits(decimalPlaces);
    const protectAmount = useProtectedAmountLabel();

    const isZero = formatDigits(Math.abs(amount)) === formatDigits(0);
    const formatted = isZero ? formatDigits(0, instrumentSymbol) : toTrueMinus(formatDigits(amount, instrumentSymbol));
    const fractionStart = isPositiveNumber(decimalPlaces) ? formatted.length - decimalPlaces - 1 : formatted.length;
    const isHero = variant === MoneyTextVariantEnum.HERO;
    const accessibilityLabel = `${prefix}${protectAmount(amount, instrumentSymbol)}`;
    const isSignTone = !MUTED_VARIANTS.has(variant) && !isDefined(tone);
    const toneClassName = cn(
        isDefined(tone) && FOREGROUND_COLOR_PALETTE[tone],
        isSignTone && isZero && 'text-secondary-foreground',
        isSignTone && !isZero && amount < 0 && 'text-destructive-foreground',
        isSignTone && !isZero && amount > 0 && 'text-primary'
    );
    const scalingProps = isHero
        ? { allowFontScaling: false, minimumFontScale: 0.5 }
        : { maxFontSizeMultiplier: ROW_MAX_FONT_SIZE_MULTIPLIER, minimumFontScale: 0.6 };

    return (
        <ProtectedText
            testID={testID}
            accessibilityLabel={accessibilityLabel}
            numberOfLines={1}
            adjustsFontSizeToFit
            {...scalingProps}
            className={cn(wholeVariants({ variant }), toneClassName)}
        >
            {`${prefix}${formatted.slice(0, fractionStart)}`}
            <Text className={fractionVariants({ variant })}>{formatted.slice(fractionStart)}</Text>
        </ProtectedText>
    );
};
