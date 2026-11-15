import type { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import type { MessageDescriptor } from '@lingui/core';

export interface CreateAccountManualOptionInterface {
    readonly type: AccountTypeEnum;
    readonly icon: UserIconNameEnum;
    readonly title: MessageDescriptor;
    readonly description: MessageDescriptor;
}
