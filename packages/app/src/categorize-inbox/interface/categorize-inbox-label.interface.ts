import type { UserIconNameEnum } from '@budgie/contracts';

export interface CategorizeInboxLabelInterface {
    readonly id: number;
    readonly title: string;
    readonly icon: UserIconNameEnum;
}
