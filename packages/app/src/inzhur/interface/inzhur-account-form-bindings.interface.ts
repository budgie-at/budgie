import type { AccountFormBindingsInterface } from '../../account/interface/account-form-bindings.interface';
import type { AccountFormFieldBindingInterface } from '../../account/interface/account-form-field-binding.interface';
import type { LiabilityAccountCreateInputInterface } from '@budgie/contracts';

export interface InzhurAccountFormBindingsInterface extends Pick<
    AccountFormBindingsInterface,
    'title' | 'icon' | 'currentBalance' | 'isActive' | 'includeInNetWorth'
> {
    readonly dividendPayout: AccountFormFieldBindingInterface<LiabilityAccountCreateInputInterface['dividendPayout']>;
}
