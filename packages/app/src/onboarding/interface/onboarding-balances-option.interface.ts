import { UserIconNameEnum } from '@budgie/contracts';

import { EmptyFn } from '@rnw-community/shared';

export interface OnboardingBalancesOptionInterface {
    readonly key: string;
    readonly icon: UserIconNameEnum;
    readonly title: string;
    readonly onPress: EmptyFn;
}
