import { Control, FieldValues, useController } from 'react-hook-form';

import { AccountBalanceFieldNamesInterface } from '../interface/account-balance-field-names.interface';

import { useAccountDetailsBindings } from './use-account-details-bindings.hook';

export const useAccountBalanceBindings = <Values extends FieldValues, const Names extends AccountBalanceFieldNamesInterface<Values>>(
    control: Control<Values>,
    names: Names
) => ({
    ...useAccountDetailsBindings(control, names),
    currentBalance: useController<Values, Names['currentBalance']>({ control, name: names.currentBalance })
});
