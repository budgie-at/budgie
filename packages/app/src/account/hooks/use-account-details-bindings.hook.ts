import { Control, FieldValues, useController } from 'react-hook-form';

import { AccountDetailsFieldNamesInterface } from '../interface/account-details-field-names.interface';

export const useAccountDetailsBindings = <Values extends FieldValues, const Names extends AccountDetailsFieldNamesInterface<Values>>(
    control: Control<Values>,
    names: Names
) => ({
    title: useController<Values, Names['title']>({ control, name: names.title }),
    icon: useController<Values, Names['icon']>({ control, name: names.icon })
});
