import type { UserIconNameEnum } from '@budgie/contracts';

export interface RuleSelectorOptionInterface {
    readonly value: string;
    readonly label: string;
    readonly description: string | null;
    readonly icon: UserIconNameEnum;
    readonly disabledReason: string | null;
}
