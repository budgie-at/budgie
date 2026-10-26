import { LiabilityAccountCreateInputInterface } from '@budgie/contracts';

import { AccountFormFieldBindingInterface } from './account-form-field-binding.interface';

export interface AccountFormBindingsInterface {
    readonly title: AccountFormFieldBindingInterface<LiabilityAccountCreateInputInterface['title']>;
    readonly icon: AccountFormFieldBindingInterface<LiabilityAccountCreateInputInterface['icon']>;
    readonly currentBalance: AccountFormFieldBindingInterface<LiabilityAccountCreateInputInterface['currentBalance']>;
    readonly instrumentId: AccountFormFieldBindingInterface<LiabilityAccountCreateInputInterface['instrumentId']>;
    readonly includeInNetWorth: AccountFormFieldBindingInterface<LiabilityAccountCreateInputInterface['includeInNetWorth']>;
    readonly isActive: AccountFormFieldBindingInterface<LiabilityAccountCreateInputInterface['isActive']>;
}
