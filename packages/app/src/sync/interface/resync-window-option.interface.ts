import type { UserIconNameEnum } from '@budgie/contracts';

export interface ResyncWindowOptionInterface {
    readonly sinceDays: number | null;
    readonly icon: UserIconNameEnum;
    readonly isDestructive: boolean;
}
