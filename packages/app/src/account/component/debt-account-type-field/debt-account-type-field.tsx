import { AccountDebtTypeEnum, DebtAccountCreateInputInterface } from '@budgie/contracts';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';
import { View } from 'react-native';

import { AccountDeptTypeCard } from '../account-dept-type-card/account-dept-type-card';

interface Props {
    readonly control: Control<DebtAccountCreateInputInterface>;
}

export const DebtAccountTypeField = ({ control }: Props) => {
    const render = ({ field: { value, onChange } }: UseControllerReturn<DebtAccountCreateInputInterface, 'debtType'>) => (
        <View className="flex-row gap-x-xl">
            <AccountDeptTypeCard type={AccountDebtTypeEnum.LENT} isSelected={value === AccountDebtTypeEnum.LENT} onSelect={onChange} />
            <AccountDeptTypeCard type={AccountDebtTypeEnum.BORROW} isSelected={value === AccountDebtTypeEnum.BORROW} onSelect={onChange} />
        </View>
    );

    return <Controller render={render} control={control} name="debtType" />;
};
