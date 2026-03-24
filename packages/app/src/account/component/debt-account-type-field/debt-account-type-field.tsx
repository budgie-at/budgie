import { AccountDebtTypeEnum } from '@budgie/contracts';
import { Control, Controller, Path, UseControllerReturn } from 'react-hook-form';
import { View } from 'react-native';

import { AccountFormSelectors } from '../../../@e2e/selectors/account-form.selector';
import { AccountDeptTypeCard } from '../account-dept-type-card/account-dept-type-card';

interface Props<T extends { debtType: AccountDebtTypeEnum }> {
    readonly control: Control<T>;
}

export const DebtAccountTypeField = <T extends { debtType: AccountDebtTypeEnum }>({ control }: Props<T>) => {
    const render = ({ field: { value, onChange } }: UseControllerReturn<T, Path<T>>) => (
        <View className="flex-row gap-x-xl">
            <AccountDeptTypeCard
                testID={AccountFormSelectors.DebtTypeCard(AccountDebtTypeEnum.LENT)}
                type={AccountDebtTypeEnum.LENT}
                isSelected={value === AccountDebtTypeEnum.LENT}
                onSelect={onChange}
            />
            <AccountDeptTypeCard
                testID={AccountFormSelectors.DebtTypeCard(AccountDebtTypeEnum.BORROW)}
                type={AccountDebtTypeEnum.BORROW}
                isSelected={value === AccountDebtTypeEnum.BORROW}
                onSelect={onChange}
            />
        </View>
    );

    return <Controller render={render} control={control} name={'debtType' as Path<T>} />;
};
