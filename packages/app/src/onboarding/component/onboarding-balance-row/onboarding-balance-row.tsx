import { ReactNode, useState } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';

import { OnboardingBalanceRowSelector } from './onboarding-balance-row.selector';

import type { AccountEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'id' | 'title' | 'icon'>;
    readonly currencySymbol: string;
    readonly value: number;
    readonly onChangeValue: (accountId: number, value: number) => void;
    readonly children?: ReactNode;
}

export const OnboardingBalanceRow = ({ account, currencySymbol, value, onChangeValue, children }: Props) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleChangeValue = (nextValue: number) => void onChangeValue(account.id, nextValue);
    const handleFocus = () => void setIsFocused(true);
    const handleBlur = () => void setIsFocused(false);

    const focusClassName = isFocused ? 'border-primary' : 'border-transparent';

    return (
        <View className={cn('gap-y-2xl rounded-[22px] border-2 bg-secondary-background p-2xl', focusClassName)}>
            <View className="flex-row items-center gap-x-xl">
                <View className="size-[44px] items-center justify-center rounded-[14px] bg-background">
                    <Icon icon={account.icon} size={20} className="text-primary" />
                </View>

                <Text className="text-primary text-md font-medium flex-1" numberOfLines={1}>
                    {account.title}
                </Text>

                <AmountInput
                    testID={OnboardingBalanceRowSelector.Amount(account.id)}
                    value={value}
                    onChangeValue={handleChangeValue}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    inputClassName="text-primary text-2xl text-right border-0 h-auto min-w-24"
                    cursorColorClassName="accent-violet-foreground"
                    borderless
                    selectTextOnFocus
                    valuePrefix={currencySymbol}
                    placeholder={`${currencySymbol}0`}
                />
            </View>

            {isDefined(children) ? <View className="gap-y-2xl border-t border-secondary-corner pt-2xl">{children}</View> : null}
        </View>
    );
};
