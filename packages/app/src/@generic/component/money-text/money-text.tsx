import { useAtomValue } from '@effect/atom-react/Hooks';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { decimalPlacesAtom } from '../../../settings/constants/settings-atoms.constant';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/row-max-font-size-multiplier.constant';
import { MoneyTextVariantEnum } from '../../enum/money-text-variant.enum';
import { cn } from '../../utils/cn.util';
import { toTrueMinus } from '../../utils/to-true-minus.util';
import { ProtectedText } from '../protected-text/protected-text';

interface Props {
    readonly amount: number;
    readonly instrumentSymbol: string;
    readonly variant: MoneyTextVariantEnum;
    readonly testID?: string;
}

const wholeVariants = cva('tabular-nums', {
    variants: {
        variant: {
            [MoneyTextVariantEnum.HERO]: 'text-center text-[44px] leading-[48px] font-semibold tracking-[-1px]',
            [MoneyTextVariantEnum.ROW]: 'text-[17px] font-semibold tracking-tight',
            [MoneyTextVariantEnum.LINE]: 'text-[15px] leading-[20px] text-secondary-foreground'
        }
    }
});

const fractionVariants = cva('text-secondary-foreground', {
    variants: {
        variant: {
            [MoneyTextVariantEnum.HERO]: 'text-[26px] font-semibold',
            [MoneyTextVariantEnum.ROW]: 'text-[13px] font-medium',
            [MoneyTextVariantEnum.LINE]: 'text-[12px]'
        }
    }
});

export const MoneyText = ({ amount, instrumentSymbol, variant, testID }: Props) => {
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const formatDigits = useFormatDigits(decimalPlaces);

    const isZero = formatDigits(Math.abs(amount)) === formatDigits(0);
    const formatted = isZero ? formatDigits(0, instrumentSymbol) : toTrueMinus(formatDigits(amount, instrumentSymbol));
    const fractionStart = isPositiveNumber(decimalPlaces) ? formatted.length - decimalPlaces - 1 : formatted.length;
    const isHero = variant === MoneyTextVariantEnum.HERO;
    const toneClassName = cn(
        variant !== MoneyTextVariantEnum.LINE && isZero && 'text-secondary-foreground',
        variant !== MoneyTextVariantEnum.LINE && !isZero && amount < 0 && 'text-destructive-foreground',
        variant !== MoneyTextVariantEnum.LINE && !isZero && amount > 0 && 'text-primary'
    );
    const scalingProps = isHero
        ? { allowFontScaling: false, minimumFontScale: 0.5 }
        : { maxFontSizeMultiplier: ROW_MAX_FONT_SIZE_MULTIPLIER, minimumFontScale: 0.6 };

    return (
        <ProtectedText
            testID={testID}
            numberOfLines={1}
            adjustsFontSizeToFit
            {...scalingProps}
            className={cn(wholeVariants({ variant }), toneClassName)}
        >
            {formatted.slice(0, fractionStart)}
            <Text className={fractionVariants({ variant })}>{formatted.slice(fractionStart)}</Text>
        </ProtectedText>
    );
};
