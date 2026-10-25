import { FieldPath, FieldValues } from 'react-hook-form';

export interface AccountDetailsFieldNamesInterface<Values extends FieldValues> {
    readonly title: FieldPath<Values>;
    readonly icon: FieldPath<Values>;
}
