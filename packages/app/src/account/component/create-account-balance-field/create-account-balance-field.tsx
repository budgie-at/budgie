import { Control, Controller, ControllerRenderProps, Path } from 'react-hook-form';

import { CreateAccountBalanceInput } from '../create-account-balance-input/create-account-balance-input';

interface Props<T extends { currentBalance: number }> {
    control: Control<T>;
    instrumentSymbol: string;
}

export const CreateAccountBalanceField = <T extends { currentBalance: number }>({
    control,
    instrumentSymbol
}: Props<T>) => {
    const renderInput = ({ field }: { field: ControllerRenderProps<T, Path<T>> }) => (
        <CreateAccountBalanceInput instrumentSymbol={instrumentSymbol} value={field.value} onChange={field.onChange} />
    );

    return <Controller control={control} name={'currentBalance' as Path<T>} render={renderInput} />;
};
