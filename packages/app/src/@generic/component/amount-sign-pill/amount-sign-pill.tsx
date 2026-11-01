import { AmountSignToggle } from '@budgie/amount-input';
import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { ClassValue } from 'cn';

import { BACKGROUND_COLOR_PALETTE } from '../../constant/background-color-palette.constant';
import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { useSignTogglePress } from '../../hook/use-sign-toggle-press.hook';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { Icon } from '../icon/icon';

interface Props {
    readonly isNegative: boolean;
    readonly variant: ColorPaletteVariant;
    readonly accessibilityLabel: string;
    readonly onToggle: () => void;
}

const SIGN_TOGGLE_HIT_SLOP = 8;

const pillVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>(
    'items-center justify-center rounded-full border w-11 h-11 active:scale-xs',
    {
        variants: {
            variant: BACKGROUND_COLOR_PALETTE
        }
    }
);

const iconVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>('', {
    variants: {
        variant: FOREGROUND_COLOR_PALETTE
    }
});

export const AmountSignPill = ({ isNegative, variant, accessibilityLabel, onToggle }: Props) => {
    const handlePress = useSignTogglePress(onToggle);

    const iconClassName = iconVariants({ variant });
    const positiveIcon = <Icon icon={UserIconNameEnum.Plus} size={20} className={iconClassName} />;
    const negativeIcon = <Icon icon={UserIconNameEnum.Minus} size={20} className={iconClassName} />;

    return (
        <AmountSignToggle
            isNegative={isNegative}
            positiveIcon={positiveIcon}
            negativeIcon={negativeIcon}
            className={pillVariants({ variant })}
            hitSlop={SIGN_TOGGLE_HIT_SLOP}
            accessibilityLabel={accessibilityLabel}
            onPress={handlePress}
        />
    );
};
