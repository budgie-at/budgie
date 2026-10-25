import { FieldPath, FieldValues } from 'react-hook-form';

import { AccountDetailsFieldNamesInterface } from './account-details-field-names.interface';

export interface AccountBalanceFieldNamesInterface<Values extends FieldValues> extends AccountDetailsFieldNamesInterface<Values> {
    readonly currentBalance: FieldPath<Values>;
}
