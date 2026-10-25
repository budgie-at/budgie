import { Control, FieldValues, useController } from 'react-hook-form';

import { AccountUpdateFieldNamesInterface } from '../interface/account-update-field-names.interface';

import { useAccountBalanceBindings } from './use-account-balance-bindings.hook';

export const useAccountUpdateBindings = <Values extends FieldValues, const Names extends AccountUpdateFieldNamesInterface<Values>>(
    control: Control<Values>,
    names: Names
) => ({
    ...useAccountBalanceBindings(control, names),
    isActive: useController<Values, Names['isActive']>({ control, name: names.isActive }),
    includeInNetWorth: useController<Values, Names['includeInNetWorth']>({ control, name: names.includeInNetWorth })
});
