import { useAtomValue } from '@effect/atom-react/Hooks';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useResolveClassNames } from 'uniwind';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { cn } from '../../../@generic/utils/cn.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

import { OnboardingBalanceRowSelector } from './onboarding-balance-row.selector';

import type { AccountEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'id' | 'title' | 'icon'>;
    readonly value: number;
    readonly onChangeValue: (accountId: number, value: number) => void;
}

export const OnboardingBalanceRow = ({ account, value, onChangeValue }: Props) => {
    const [isFocused, setIsFocused] = useState(false);

    const { color } = useResolveClassNames('text-primary');
    const currencySymbol = useAtomValue(defaultInstrumentAtom).symbol;

    const handleChangeValue = (nextValue: number) => void onChangeValue(account.id, nextValue);
    const handleFocus = () => void setIsFocused(true);
    const handleBlur = () => void setIsFocused(false);

    const focusClassName = isFocused ? 'border-primary' : 'border-transparent';

    return (
        <GroupedListRow
            left={<GroupedListIcon icon={account.icon} />}
            title={
                <Text className="text-primary text-[17px]" numberOfLines={2}>
                    {account.title}
                </Text>
            }
            right={
                <View
                    className={cn(
                        'min-h-[44px] min-w-[112px] max-w-[50%] shrink justify-center rounded-[10px] border-[1.5px] bg-surface px-md dark:bg-surface-fill',
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
                        selectionColor={color}
                        cursorColor={color}
                        borderless
                        selectTextOnFocus
                        valuePrefix={currencySymbol}
                        placeholder={`${currencySymbol}0`}
                    />
                </View>
            }
        />
    );
};
