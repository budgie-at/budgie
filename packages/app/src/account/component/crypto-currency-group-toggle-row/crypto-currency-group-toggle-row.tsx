import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { CryptoCurrencyGroupCardSelector } from '../crypto-currency-group-card/crypto-currency-group-card.selector';

import type { EmptyFn } from '@rnw-community/shared';

interface Props {
    readonly accountsCount: number;
    readonly instrumentCode: string;
    readonly isOpen: boolean;
    readonly onPress: EmptyFn;
    readonly testID: string;
}

const toggleVariants = cva('min-h-[32px] flex-row items-center gap-x-xs self-start pt-xxs pb-md pr-xl active:scale-100 active:opacity-60', {
    variants: { isStacked: { true: 'pl-3xl', false: 'pl-[64px]' } }
});

export const CryptoCurrencyGroupToggleRow = ({ accountsCount, instrumentCode, isOpen, onPress, testID }: Props) => {
    const { t } = useLingui();
    const isStacked = useIsAccessibilityTextSize();

    const chevronIcon = isOpen ? UserIconNameEnum.ChevronDown : UserIconNameEnum.ChevronRight;
    const toggleAccessibilityState = { expanded: isOpen };
    const accountsCountLabel = t({
        message: plural(accountsCount, {
            one: '# account',
            other: '# accounts'
        })
    });

    return (
        <HapticPressable
            accessible
            accessibilityRole="button"
            accessibilityState={toggleAccessibilityState}
            onPress={onPress}
            className={toggleVariants({ isStacked })}
            testID={testID}
        >
            <Text
                className="text-[13px] font-medium text-secondary-foreground"
                maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
                testID={CryptoCurrencyGroupCardSelector.AccountCount(instrumentCode)}
            >
                {accountsCountLabel}
            </Text>
            <Icon icon={chevronIcon} size={14} className="text-secondary-foreground" />
        </HapticPressable>
    );
};
