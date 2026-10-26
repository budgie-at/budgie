import { AccountDebtTypeEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { AccountDeptTypeCard } from '../account-dept-type-card/account-dept-type-card';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';

interface Props {
    readonly value: AccountDebtTypeEnum;
    readonly onChange: (value: AccountDebtTypeEnum) => void;
}

export const DebtAccountTypeField = ({ value, onChange }: Props) => (
    <View className="flex-row gap-x-xl">
        <AccountDeptTypeCard
            testID={CreateAccountScreenSelector.DebtTypeCard(AccountDebtTypeEnum.LENT)}
            type={AccountDebtTypeEnum.LENT}
            isSelected={value === AccountDebtTypeEnum.LENT}
            onSelect={onChange}
        />
        <AccountDeptTypeCard
            testID={CreateAccountScreenSelector.DebtTypeCard(AccountDebtTypeEnum.BORROW)}
            type={AccountDebtTypeEnum.BORROW}
            isSelected={value === AccountDebtTypeEnum.BORROW}
            onSelect={onChange}
        />
    </View>
);
