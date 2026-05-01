import type { UserIconNameEnum } from '@budgie/contracts';

export interface ConsolidationSourceAccountSummaryInterface {
    readonly fromIcon: UserIconNameEnum | null;
    readonly fromTitle: string | null;
    readonly toIcon: UserIconNameEnum | null;
    readonly toTitle: string | null;
}
