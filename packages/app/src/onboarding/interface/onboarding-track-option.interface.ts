import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';

export interface OnboardingTrackOptionInterface {
    readonly type: AccountTypeEnum;
    readonly icon: UserIconNameEnum;
    readonly title: string;
}
