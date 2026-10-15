import { Text } from 'react-native';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';

import { OnboardingBalanceRowSelector } from './onboarding-balance-row.selector';

import type { AccountEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'id' | 'title' | 'icon'>;
    readonly currencySymbol: string;
    readonly value: number;
    readonly onChangeValue: (accountId: number, value: number) => void;
}

export const OnboardingBalanceRow = ({ account, currencySymbol, value, onChangeValue }: Props) => {
    const handleChangeValue = (nextValue: number) => void onChangeValue(account.id, nextValue);

    return (
        <Card variant="secondary" size="md" className="flex-row items-center gap-x-lg">
            <CircleIcon icon={account.icon} variant="primary" size={36} iconSize={18} />
            <Text className="text-primary text-md font-medium flex-1" numberOfLines={1}>
                {account.title}
            </Text>
            <AmountInput
                testID={OnboardingBalanceRowSelector.Amount(account.id)}
                value={value}
                onChangeValue={handleChangeValue}
                inputClassName="text-primary text-right border-0 h-auto min-w-24"
                borderless
                selectTextOnFocus
                valuePrefix={`${currencySymbol} `}
                placeholder={`${currencySymbol} 0`}
            />
        </Card>
    );
};
