import { FieldPath, FieldValues } from 'react-hook-form';

import { AccountBalanceFieldNamesInterface } from './account-balance-field-names.interface';

export interface AccountUpdateFieldNamesInterface<Values extends FieldValues> extends AccountBalanceFieldNamesInterface<Values> {
    readonly isActive: FieldPath<Values>;
    readonly includeInNetWorth: FieldPath<Values>;
}
