import { Control, FieldValues, useController } from 'react-hook-form';

import { AccountCreateFieldNamesInterface } from '../interface/account-create-field-names.interface';

import { useAccountBalanceBindings } from './use-account-balance-bindings.hook';

export const useAccountCreateBindings = <Values extends FieldValues, const Names extends AccountCreateFieldNamesInterface<Values>>(
    control: Control<Values>,
    names: Names
) => ({
    ...useAccountBalanceBindings(control, names),
    instrumentId: useController<Values, Names['instrumentId']>({ control, name: names.instrumentId }),
    includeInNetWorth: useController<Values, Names['includeInNetWorth']>({ control, name: names.includeInNetWorth })
});
