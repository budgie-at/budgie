import { FieldPath, FieldValues } from 'react-hook-form';

import { AccountBalanceFieldNamesInterface } from './account-balance-field-names.interface';

export interface AccountCreateFieldNamesInterface<Values extends FieldValues> extends AccountBalanceFieldNamesInterface<Values> {
    readonly instrumentId: FieldPath<Values>;
    readonly includeInNetWorth: FieldPath<Values>;
}
