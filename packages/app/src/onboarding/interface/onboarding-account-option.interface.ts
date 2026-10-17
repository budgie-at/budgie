import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';

export interface OnboardingAccountOptionInterface {
    readonly type: AccountTypeEnum;
    readonly icon: UserIconNameEnum;
    readonly title: string;
}
