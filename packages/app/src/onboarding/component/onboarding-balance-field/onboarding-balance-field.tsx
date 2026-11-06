import { useAtomValue } from '@effect/atom-react/Hooks';
import { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useResolveClassNames } from 'uniwind';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { MAX_CHROME_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-chrome-font-size-multiplier.constant';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { OnboardingBalanceRowSelector } from '../onboarding-balance-row/onboarding-balance-row.selector';

import type { AccountEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'id' | 'title'>;
    readonly value: number;
    readonly onChangeValue: (accountId: number, value: number) => void;
}

export const OnboardingBalanceField = ({ account, value, onChangeValue }: Props) => {
    const [isFocused, setIsFocused] = useState(false);
    const { fontScale } = useWindowDimensions();
    const { color } = useResolveClassNames('text-primary');
    const currencySymbol = useAtomValue(defaultInstrumentAtom).symbol;
    const handleChangeValue = (nextValue: number) => void onChangeValue(account.id, nextValue);
    const handleFocus = () => void setIsFocused(true);
    const handleBlur = () => void setIsFocused(false);
    const focusClassName = isFocused ? 'border-primary' : 'border-transparent';
    const widthClassName = fontScale > MAX_FONT_SIZE_MULTIPLIER ? 'self-stretch' : 'min-w-[112px] max-w-[50%] shrink';

    return (
        <View
            className={cn(
                'min-h-[44px] justify-center rounded-[10px] border-[1.5px] bg-surface px-md dark:bg-surface-fill',
                widthClassName,
                focusClassName
            )}
        >
            <AmountInput
                accessibilityLabel={account.title}
                testID={OnboardingBalanceRowSelector.Amount(account.id)}
                value={value}
                onChangeValue={handleChangeValue}
                onFocus={handleFocus}
                onBlur={handleBlur}
                inputClassName="min-h-[44px] px-0 py-0 text-primary text-[19px] text-right border-0 h-auto"
                maxFontSizeMultiplier={MAX_CHROME_FONT_SIZE_MULTIPLIER}
                selectionColor={color}
                cursorColor={color}
                borderless
                selectTextOnFocus
                valuePrefix={currencySymbol}
                placeholder={`${currencySymbol}0`}
            />
        </View>
    );
};
