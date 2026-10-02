import { AccountTypeEnum } from '@budgie/contracts';

export interface OnboardingAccountInputInterface {
    readonly type: AccountTypeEnum;
    readonly title: string;
}
