import { ControllerFieldState } from 'react-hook-form';

import { AccountFormFieldInterface } from './account-form-field.interface';

export interface AccountFormFieldBindingInterface<Value> {
    readonly field: AccountFormFieldInterface<Value>;
    readonly fieldState: ControllerFieldState;
}
