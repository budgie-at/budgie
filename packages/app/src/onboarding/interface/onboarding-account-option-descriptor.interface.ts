import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';

export interface OnboardingAccountOptionDescriptorInterface {
    readonly type: AccountTypeEnum;
    readonly icon: UserIconNameEnum;
    readonly title: MessageDescriptor;
}
